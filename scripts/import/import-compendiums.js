/**
 * Import script for Dresden RPG compendium packs
 * Run this script in the Foundry console to populate the compendium packs
 */

async function importDresdenCompendiums() {
    ui.notifications.info("Starting Dresden RPG compendium import...");
    
    try {
        // Import Aspects
        await importAspects();
        
        // Import Skills
        await importSkills();
        
        // Import Stunts
        await importStunts();
        
        // Import Extras
        await importExtras();
        
        // Import NPCs
        await importNPCs();
        
        ui.notifications.info("Dresden RPG compendium import complete!");
    } catch (error) {
        console.error("Error importing compendiums:", error);
        ui.notifications.error("Error importing compendiums: " + error.message);
    }
}

async function importAspects() {
    const pack = game.packs.get("dresdenrpg.dresdenrpg-aspects");
    if (!pack) {
        console.error("Aspects pack not found");
        return;
    }
    
    const response = await fetch("systems/dresdenrpg/templates/data/aspects.json");
    const aspects = await response.json();
    
    for (const aspect of aspects) {
        const itemData = {
            name: aspect.name,
            type: "Extra",
            system: {
                description: {
                    value: aspect.description
                }
            }
        };
        
        await Item.create(itemData, { pack: pack.collection });
    }
    
    ui.notifications.info(`Imported ${aspects.length} aspects`);
}

async function importSkills() {
    const pack = game.packs.get("dresdenrpg.dresdenrpg-skills");
    if (!pack) {
        console.error("Skills pack not found");
        return;
    }
    
    const response = await fetch("systems/dresdenrpg/templates/data/skills.json");
    const skills = await response.json();
    
    for (const skill of skills) {
        const itemData = {
            name: skill.name,
            type: "Extra",
            system: {
                description: {
                    value: skill.description
                }
            }
        };
        
        await Item.create(itemData, { pack: pack.collection });
    }
    
    ui.notifications.info(`Imported ${skills.length} skills`);
}

async function importStunts() {
    const pack = game.packs.get("dresdenrpg.dresdenrpg-stunts");
    if (!pack) {
        console.error("Stunts pack not found");
        return;
    }
    
    const response = await fetch("systems/dresdenrpg/templates/data/stunts.json");
    const stunts = await response.json();
    
    for (const stunt of stunts) {
        const itemData = {
            name: stunt.name,
            type: "Extra",
            system: {
                description: {
                    value: stunt.description
                },
                refresh: stunt.refresh_cost,
                stunts: {
                    [btoa(stunt.name)]: {
                        name: stunt.name,
                        description: stunt.description,
                        refresh_cost: stunt.refresh_cost,
                        linked_skill: stunt.linked_skill
                    }
                }
            }
        };
        
        await Item.create(itemData, { pack: pack.collection });
    }
    
    ui.notifications.info(`Imported ${stunts.length} stunts`);
}

async function importExtras() {
    const pack = game.packs.get("dresdenrpg.dresdenrpg-extras");
    if (!pack) {
        console.error("Extras pack not found");
        return;
    }
    
    const response = await fetch("systems/dresdenrpg/templates/data/extras.json");
    const extras = await response.json();
    
    for (const extra of extras) {
        const itemData = {
            name: extra.name,
            type: "Extra",
            system: {
                description: {
                    value: extra.description
                },
                permissions: extra.permissions,
                costs: extra.costs,
                refresh: extra.refresh
            }
        };
        
        await Item.create(itemData, { pack: pack.collection });
    }
    
    ui.notifications.info(`Imported ${extras.length} extras`);
}

async function importNPCs() {
    const pack = game.packs.get("dresdenrpg.dresdenrpg-npcs");
    if (!pack) {
        console.error("NPCs pack not found");
        return;
    }
    
    const response = await fetch("systems/dresdenrpg/templates/data/npcs.json");
    const npcs = await response.json();
    
    for (const npc of npcs) {
        // Convert skills to system format
        const skills = {};
        for (const [skillName, rank] of Object.entries(npc.skills)) {
            const key = btoa(skillName);
            skills[key] = {
                name: skillName,
                rank: rank,
                description: ""
            };
        }
        
        // Convert aspects to system format
        const aspects = {};
        for (const [aspectType, aspectName] of Object.entries(npc.aspects)) {
            const key = btoa(aspectName);
            aspects[key] = {
                name: aspectName,
                value: aspectName,
                description: ""
            };
        }
        
        // Convert stunts to system format
        const stunts = {};
        for (const stuntName of npc.stunts) {
            const key = btoa(stuntName);
            stunts[key] = {
                name: stuntName,
                description: "",
                refresh_cost: 1
            };
        }
        
        const actorData = {
            name: npc.name,
            type: npc.type || "dresdenrpg",
            system: {
                details: {
                    description: {
                        value: npc.description
                    },
                    fatePoints: {
                        refresh: npc.refresh,
                        current: npc.fate_points
                    }
                },
                skills: skills,
                aspects: aspects,
                stunts: stunts
            }
        };
        
        await Actor.create(actorData, { pack: pack.collection });
    }
    
    ui.notifications.info(`Imported ${npcs.length} NPCs`);
}

// Make the function available globally
window.importDresdenCompendiums = importDresdenCompendiums;