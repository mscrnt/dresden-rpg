/**
 * Dresden Files RPG Roll Mechanics
 * Handles magical rolls, skill checks, and combat
 */

class DresdenRolls {
    /**
     * Roll a spell using Conviction (power) and Discipline (control)
     * @param {Actor} actor - The actor casting the spell
     * @param {Object} options - Roll options
     * @param {number} options.power - Base power of the spell
     * @param {string} options.element - Element being used (fire, air, earth, water, spirit)
     * @param {string} options.type - Type of spell (attack, block, maneuver)
     * @param {number} options.bonus - Additional bonuses
     */
    static async rollSpell(actor, options = {}) {
        const conviction = fcoConstants.gbn(actor.system.skills, "Conviction")?.rank || 0;
        const discipline = fcoConstants.gbn(actor.system.skills, "Discipline")?.rank || 0;
        
        // Power roll (Conviction + modifiers)
        const powerFormula = `4dF + ${conviction} + ${options.bonus || 0}`;
        const powerRoll = new Roll(powerFormula);
        await powerRoll.evaluate();
        
        // Control roll (Discipline + modifiers)
        const controlFormula = `4dF + ${discipline} + ${options.bonus || 0}`;
        const controlRoll = new Roll(controlFormula);
        await controlRoll.evaluate();
        
        // Determine spell success and backlash
        const actualPower = Math.min(powerRoll.total, options.power || conviction);
        const controlled = controlRoll.total >= actualPower;
        const backlash = controlled ? 0 : actualPower - controlRoll.total;
        
        // Prepare chat data
        const chatData = {
            actor: actor,
            element: options.element || "force",
            spellType: options.type || "evocation",
            powerRoll: powerRoll,
            controlRoll: controlRoll,
            actualPower: actualPower,
            controlled: controlled,
            backlash: backlash,
            willpowerSpent: options.willpowerSpent || 0
        };
        
        // Render chat template
        const html = await renderTemplate("systems/dresdenrpg/templates/chat/spell-roll.html", chatData);
        
        // Create chat message
        const messageData = {
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: html,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            rolls: [powerRoll, controlRoll]
        };
        
        await ChatMessage.create(messageData);
        
        // Apply backlash if any
        if (backlash > 0 && actor.isOwner) {
            ui.notifications.warn(`${actor.name} takes ${backlash} mental stress from backlash!`);
            // TODO: Automatically apply stress when stress system is fully integrated
        }
        
        return { powerRoll, controlRoll, actualPower, controlled, backlash };
    }
    
    /**
     * Roll a social conflict action
     * @param {Actor} actor - The actor making the social attack
     * @param {Object} options - Roll options
     * @param {string} options.skill - Skill being used (Intimidation, Rapport, Deceit, etc.)
     * @param {string} options.approach - Social approach (attack, maneuver, block)
     * @param {number} options.bonus - Additional bonuses
     */
    static async rollSocial(actor, options = {}) {
        const skill = fcoConstants.gbn(actor.system.skills, options.skill);
        if (!skill) {
            ui.notifications.error(`${actor.name} doesn't have the ${options.skill} skill!`);
            return;
        }
        
        const formula = `4dF + ${skill.rank} + ${options.bonus || 0}`;
        const roll = new Roll(formula);
        await roll.evaluate();
        
        // Prepare chat data
        const chatData = {
            actor: actor,
            skill: skill,
            approach: options.approach || "attack",
            roll: roll,
            bonus: options.bonus || 0
        };
        
        // Render chat template
        const html = await renderTemplate("systems/dresdenrpg/templates/chat/social-roll.html", chatData);
        
        // Create chat message
        const messageData = {
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: html,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            rolls: [roll]
        };
        
        await ChatMessage.create(messageData);
        
        return roll;
    }
    
    /**
     * Roll a physical stress check
     * @param {Actor} actor - The actor taking stress
     * @param {Object} options - Roll options
     * @param {number} options.stress - Amount of stress to potentially take
     * @param {string} options.type - Type of stress (physical or mental)
     */
    static async rollStress(actor, options = {}) {
        const endurance = fcoConstants.gbn(actor.system.skills, "Endurance")?.rank || 0;
        const discipline = fcoConstants.gbn(actor.system.skills, "Discipline")?.rank || 0;
        
        const skill = options.type === "mental" ? discipline : endurance;
        const skillName = options.type === "mental" ? "Discipline" : "Endurance";
        
        const formula = `4dF + ${skill}`;
        const roll = new Roll(formula);
        await roll.evaluate();
        
        const success = roll.total >= (options.stress || 0);
        
        // Prepare chat data
        const chatData = {
            actor: actor,
            stressType: options.type || "physical",
            stressAmount: options.stress || 0,
            skill: skillName,
            skillRank: skill,
            roll: roll,
            success: success
        };
        
        // Render chat template
        const html = await renderTemplate("systems/dresdenrpg/templates/chat/stress-roll.html", chatData);
        
        // Create chat message
        const messageData = {
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: html,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            rolls: [roll]
        };
        
        await ChatMessage.create(messageData);
        
        return { roll, success };
    }
    
    /**
     * Spend willpower to boost a magical effect
     * @param {Actor} actor - The actor spending willpower
     * @param {number} amount - Amount of willpower to spend
     */
    static async spendWillpower(actor, amount = 1) {
        const currentWillpower = actor.system.dresden?.willpower || 0;
        
        if (currentWillpower < amount) {
            ui.notifications.error(`${actor.name} doesn't have enough willpower!`);
            return false;
        }
        
        await actor.update({
            "system.dresden.willpower": currentWillpower - amount
        });
        
        // Create chat message
        const messageData = {
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: `<div class="dresden-willpower">
                <h3>${actor.name} spends ${amount} Willpower</h3>
                <p>Remaining Willpower: ${currentWillpower - amount}</p>
            </div>`,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        };
        
        await ChatMessage.create(messageData);
        
        return true;
    }
}

// Register Dresden rolls globally
window.DresdenRolls = DresdenRolls;

// Hook into the ready event to set up additional features
Hooks.once("ready", () => {
    console.log("Dresden RPG | Roll mechanics initialized");
    
    // Add roll methods to Actor class
    CONFIG.Actor.documentClass.prototype.rollSpell = function(options) {
        return DresdenRolls.rollSpell(this, options);
    };
    
    CONFIG.Actor.documentClass.prototype.rollSocial = function(options) {
        return DresdenRolls.rollSocial(this, options);
    };
    
    CONFIG.Actor.documentClass.prototype.rollStress = function(options) {
        return DresdenRolls.rollStress(this, options);
    };
    
    CONFIG.Actor.documentClass.prototype.spendWillpower = function(amount) {
        return DresdenRolls.spendWillpower(this, amount);
    };
});