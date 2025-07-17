/**
 * Dresden RPG Compendium Import Macro
 * 
 * Create a new script macro in Foundry and paste this code.
 * Run the macro to import all Dresden RPG compendium data.
 */

// Load the import script
const script = document.createElement('script');
script.src = 'systems/dresdenrpg/scripts/import/import-compendiums.js';
script.onload = async () => {
    // Wait a moment for the script to initialize
    setTimeout(async () => {
        if (window.importDresdenCompendiums) {
            await window.importDresdenCompendiums();
        } else {
            ui.notifications.error("Import function not found. Please check the console for errors.");
        }
    }, 100);
};
script.onerror = () => {
    ui.notifications.error("Failed to load import script. Please check that the system is properly installed.");
};
document.head.appendChild(script);