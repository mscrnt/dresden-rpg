/**
 * Dresden RPG Development Setup Script
 * 
 * This script sets up a development world for testing the Dresden RPG system.
 * Run this in the Foundry console after creating a new world with the Dresden RPG system.
 * 
 * Usage:
 * 1. Create a new world using the Dresden RPG system
 * 2. Open the browser console (F12)
 * 3. Paste and run this entire script
 */

async function setupDresdenDevWorld() {
    console.log("🧙 Setting up Dresden RPG development world...");
    
    try {
        // 1. Import compendiums
        console.log("📚 Importing compendiums...");
        const importScript = document.createElement('script');
        importScript.src = 'systems/dresdenrpg/scripts/import/import-compendiums.js';
        document.head.appendChild(importScript);
        
        // Wait for script to load and run import
        await new Promise(resolve => {
            importScript.onload = async () => {
                if (window.importDresdenCompendiums) {
                    await window.importDresdenCompendiums();
                }
                resolve();
            };
        });
        
        // 2. Create test scene
        console.log("🎬 Creating test scene...");
        const scene = await Scene.create({
            name: "Mac's Pub - Test Scene",
            width: 2000,
            height: 2000,
            padding: 0.25,
            backgroundColor: "#2c3e50",
            gridType: 1,
            grid: 100
        });
        
        await scene.activate();
        
        // 3. Create test actors
        console.log("🎭 Creating test actors...");
        
        // Create Harry Dresden
        const harry = await Actor.create({
            name: "Harry Dresden (Test)",
            type: "dresdenrpg",
            img: "icons/magic/fire/orb-fireball-red.webp",
            system: {
                details: {
                    description: { value: "Chicago's only professional wizard" },
                    fatePoints: { current: 3, refresh: 3 }
                },
                dresden: {
                    magicRating: 5,
                    willpower: 8
                }
            }
        });
        
        // Add some skills to Harry
        const skills = {
            [btoa("Conviction")]: { name: "Conviction", rank: 5 },
            [btoa("Discipline")]: { name: "Discipline", rank: 5 },
            [btoa("Lore")]: { name: "Lore", rank: 4 },
            [btoa("Athletics")]: { name: "Athletics", rank: 3 },
            [btoa("Investigation")]: { name: "Investigation", rank: 3 }
        };
        
        await harry.update({ "system.skills": skills });
        
        // Create Murphy
        const murphy = await Actor.create({
            name: "Karrin Murphy (Test)",
            type: "dresdenrpg",
            img: "icons/weapons/guns/gun-pistol-brown.webp",
            system: {
                details: {
                    description: { value: "Former cop, current badass" },
                    fatePoints: { current: 5, refresh: 5 }
                }
            }
        });
        
        // 4. Create test macros
        console.log("🎲 Creating test macros...");
        
        // Spell casting macro
        await Macro.create({
            name: "Cast Spell (Test)",
            type: "script",
            img: "icons/magic/fire/beam-jet-stream-yellow.webp",
            command: `
// Test spell casting
const actor = game.user.character || canvas.tokens.controlled[0]?.actor;
if (!actor) {
    ui.notifications.warn("Select a token or assign a character first!");
    return;
}

if (actor.rollSpell) {
    actor.rollSpell({
        power: 4,
        element: "fire",
        type: "attack",
        bonus: 0
    });
} else {
    ui.notifications.error("This actor doesn't have spell casting abilities!");
}`,
            folder: null,
            sort: 0,
            permission: { default: 2 },
            flags: {}
        });
        
        // Social roll macro
        await Macro.create({
            name: "Social Attack (Test)",
            type: "script",
            img: "icons/skills/social/diplomacy-handshake-blue.webp",
            command: `
// Test social conflict
const actor = game.user.character || canvas.tokens.controlled[0]?.actor;
if (!actor) {
    ui.notifications.warn("Select a token or assign a character first!");
    return;
}

if (actor.rollSocial) {
    actor.rollSocial({
        skill: "Intimidation",
        approach: "attack",
        bonus: 0
    });
} else {
    ui.notifications.error("Actor doesn't have social roll capability!");
}`,
            folder: null,
            sort: 0,
            permission: { default: 2 },
            flags: {}
        });
        
        // 5. Create journal entries
        console.log("📖 Creating reference journal entries...");
        
        await JournalEntry.create({
            name: "Dresden RPG Quick Reference",
            content: {
                pages: [{
                    type: "text",
                    name: "Quick Start Guide",
                    text: {
                        content: `
<h1>Dresden RPG Quick Start</h1>
<h2>Basic Rolls</h2>
<ul>
    <li><strong>Skill Rolls:</strong> 4dF + Skill Rank</li>
    <li><strong>Spell Power:</strong> 4dF + Conviction</li>
    <li><strong>Spell Control:</strong> 4dF + Discipline</li>
</ul>

<h2>Test Features</h2>
<ul>
    <li>Click the Dresden tab on character sheets to see magic stats</li>
    <li>Use the test macros to try spell casting</li>
    <li>Click stress boxes to mark them</li>
    <li>Check the compendiums for pre-made content</li>
</ul>

<h2>Magic System</h2>
<p>When casting a spell:</p>
<ol>
    <li>Decide how much power to gather (up to Conviction)</li>
    <li>Roll Conviction to see actual power gathered</li>
    <li>Roll Discipline to control the spell</li>
    <li>If control fails, take backlash stress!</li>
</ol>
                        `
                    }
                }]
            }
        });
        
        // 6. Configure world settings
        console.log("⚙️ Configuring world settings...");
        
        // Set up some default tracks
        await game.settings.set("fate-core-official", "tracks", {
            [btoa("Physical Stress")]: {
                name: "Physical Stress",
                category: "Combat",
                boxes: 4,
                box_values: [false, false, false, false]
            },
            [btoa("Mental Stress")]: {
                name: "Mental Stress",
                category: "Combat",
                boxes: 4,
                box_values: [false, false, false, false]
            }
        });
        
        // 7. Assign character to user
        if (game.user.isGM) {
            await game.user.update({ character: harry.id });
            console.log("✅ Assigned Harry Dresden as your character");
        }
        
        // Success message
        ui.notifications.info("✨ Dresden RPG development world setup complete!", { permanent: true });
        
        console.log(`
🎉 Setup Complete! 🎉

Your Dresden RPG development world is ready:
- Test actors created (Harry & Murphy)
- Test macros added to hotbar
- Reference journal created
- Compendiums imported

Next steps:
1. Open Harry's character sheet and explore the Dresden tab
2. Try the test macros from the hotbar
3. Create a token for Harry and test spell casting
4. Check the compendiums for more content

Happy testing! 🧙‍♂️
        `);
        
    } catch (error) {
        console.error("❌ Error during setup:", error);
        ui.notifications.error("Setup failed! Check console for details.");
    }
}

// Run the setup
setupDresdenDevWorld();