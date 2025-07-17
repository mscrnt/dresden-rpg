# Dresden Files RPG for Foundry VTT

![Foundry Version](https://img.shields.io/badge/Foundry-v12-green)
![System Version](https://img.shields.io/badge/Version-0.1.1-blue)
![License](https://img.shields.io/badge/License-GPLv3-blue)

A comprehensive implementation of the Dresden Files Role-Playing Game for Foundry Virtual Tabletop, based on the Fate Core Official system by Richard Bellingham.

## Features

### 🎭 Character Management
- **Dresden-specific character sheets** with dedicated magic tab
- **Magic Rating** and **Willpower** tracking
- **Physical and Mental Stress** tracks (4 boxes each)
- **Consequence slots** (Mild, Moderate, Severe)
- Full integration with Fate Core mechanics

### 🎲 Magic System
- **Evocation spell casting** with power/control mechanics
- **Thaumaturgy** support for ritual magic
- **Backlash calculation** for failed control rolls
- **Willpower expenditure** for boosting magical effects
- Specialized chat cards for spell results

### 📚 Compendium Content
- **Dresden-specific aspects** (Wizard of the White Council, The Sight, etc.)
- **Complete skill list** from Dresden Files RPG
- **Stunts and Powers** (Evocation, Thaumaturgy, Inhuman Strength, etc.)
- **Extras** (Warden's Sword, Shield Bracelet, Swords of the Cross)
- **Sample NPCs** including Harry Dresden, Karrin Murphy, and more

### 🎨 Themed UI
- Dark magical atmosphere with purple accents
- Animated magical effects and glows
- Custom Dresden tab with pentacle watermark
- Themed splash screen with Dresden quote
- Gradient stress boxes and consequence tracking

### 🎯 Roll Mechanics
- **Spell casting rolls** with separate power and control
- **Social conflict** actions (attack, maneuver, block)
- **Stress checks** for physical and mental damage
- Beautiful chat cards with roll results

## Installation

### Method 1: Install from Manifest
1. In Foundry VTT, go to **Game Systems** tab
2. Click **Install System**
3. Paste this manifest URL:
   ```
   https://raw.githubusercontent.com/mscrnt/dresden-rpg/main/system.json
   ```
4. Click **Install**

### Method 2: Manual Installation
1. Download the latest release from GitHub
2. Extract to your Foundry's `Data/systems/` directory
3. Restart Foundry VTT

## Quick Start

### For New Worlds
1. Create a new world using the Dresden RPG system
2. Open the browser console (F12)
3. Run the development setup script:
   ```javascript
   const script = document.createElement('script');
   script.src = 'systems/dresdenrpg/scripts/setup-dev-world.js';
   document.head.appendChild(script);
   ```
4. This will import all compendiums and create test content

### Importing Compendiums Manually
1. Create a script macro with this content:
   ```javascript
   const script = document.createElement('script');
   script.src = 'systems/dresdenrpg/scripts/import/import-compendiums.js';
   script.onload = () => window.importDresdenCompendiums();
   document.head.appendChild(script);
   ```
2. Run the macro to import all Dresden content

## Usage

### Creating a Wizard Character
1. Create a new Actor of type "dresdenrpg"
2. Navigate to the **Dresden** tab
3. Set your **Magic Rating** (typically 1-5)
4. Set your **Willpower** (mental fuel for magic)
5. Add Conviction and Discipline skills for spell casting

### Casting Spells
```javascript
// Example: Cast a fire evocation
actor.rollSpell({
    power: 4,        // How much power to gather
    element: "fire", // Element type
    type: "attack",  // Spell type
    bonus: 0         // Any bonuses
});
```

### Social Conflicts
```javascript
// Example: Intimidate someone
actor.rollSocial({
    skill: "Intimidation",
    approach: "attack",
    bonus: 0
});
```

## Recommended Modules
- **Dice So Nice**: 3D dice animations
- **Token Action HUD**: Quick access to character actions
- **Combat Utility Belt**: Enhanced combat features

## Development

### Project Structure
```
dresden-rpg/
├── scripts/          # Core system scripts
│   ├── dresden-rolls.js    # Magic system implementation
│   └── import/      # Compendium import scripts
├── templates/       # HTML templates
│   ├── chat/       # Chat card templates
│   └── data/       # Compendium source data
├── styles/         # CSS styling
│   └── dresden.css # Dresden-specific styles
└── packs/          # Compendium databases
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly in Foundry VTT
5. Submit a pull request

## Credits

- **System Development**: Kenneth Blossom and contributors
- **Based on**: Fate Core Official by Richard Bellingham
- **Dresden Files RPG**: Evil Hat Productions
- **Special Thanks**: Jim Butcher for creating the Dresden Files universe

## License

Software License: GNU GPLv3

### Content License
This work is based on Fate Core System and Fate Accelerated Edition (found at http://www.faterpg.com/), products of Evil Hat Productions, LLC, developed, authored, and edited by Leonard Balsera, Brian Engard, Jeremy Keller, Ryan Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks, and Rob Donoghue, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/).

This work is based on Fate Condensed (found at http://www.faterpg.com/), a product of Evil Hat Productions, LLC, developed, authored, and edited by PK Sullivan, Ed Turner, Leonard Balsera, Fred Hicks, Richard Bellingham, Robert Hanz, Ryan Macklin, and Sophie Lagacé, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/).

The Dresden Files RPG is © Evil Hat Productions.

## Support

- **Issues**: [GitHub Issues](https://github.com/mscrnt/dresden-rpg/issues)
- **Documentation**: See [DRESDEN-README.md](DRESDEN-README.md) for detailed usage guide

---

*"The building was on fire, and it wasn't my fault."* - Harry Dresden
