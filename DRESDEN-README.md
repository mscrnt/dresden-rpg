# Dresden Files RPG - System Guide

## Features Overview

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

## Quick Start Guide

### 1. Initial Setup
After creating a new world with the Dresden RPG system:

1. Open the browser console (F12)
2. Run the setup script:
```javascript
const script = document.createElement('script');
script.src = 'systems/dresdenrpg/scripts/setup-dev-world.js';
document.head.appendChild(script);
```

This will:
- Import all Dresden compendiums
- Create a test scene (Mac's Pub)
- Create sample characters
- Add useful macros
- Set up basic world configuration

### 2. Creating a Character

#### Basic Setup
1. Create a new Actor, type "dresdenrpg"
2. Fill in basic information on the main sheet tab
3. Set up skills (especially Conviction and Discipline for magic users)

#### Magic Configuration
1. Navigate to the **Dresden** tab
2. Set **Magic Rating** (1-5 typically)
3. Set **Willpower** points
4. Track stress and consequences as needed

### 3. Using the Magic System

#### Casting Evocation
```javascript
// From a macro or console
actor.rollSpell({
    power: 4,        // Power level to attempt
    element: "fire", // Element: fire, air, earth, water, spirit
    type: "attack",  // Type: attack, block, maneuver
    bonus: 0         // Any bonuses to rolls
});
```

#### Social Conflicts
```javascript
actor.rollSocial({
    skill: "Intimidation", // Or Rapport, Deceit, etc.
    approach: "attack",    // attack, maneuver, or block
    bonus: 0
});
```

#### Stress Checks
```javascript
actor.rollStress({
    stress: 4,          // Amount of incoming stress
    type: "physical"    // or "mental"
});
```

### 4. Compendium Content

The system includes several compendiums:
- **Aspects**: High concepts and troubles from the Dresden universe
- **Skills**: Complete Dresden Files RPG skill list
- **Stunts**: Powers and abilities including magic
- **Extras**: Items, mantles, and permissions
- **NPCs**: Pre-made characters from the novels

### 5. Custom Content

#### Adding Custom Stunts
1. Go to Settings → Setup Stunts
2. Create new stunt with:
   - Name and description
   - Refresh cost
   - Linked skill (if applicable)
   - Bonus value (if it provides a bonus)

#### Adding Custom Aspects
Use the standard Fate Core Official aspect system to add Dresden-themed aspects.

## Magic System Details

### Evocation Process
1. **Gather Power**: Roll Conviction + 4dF
2. **Control Power**: Roll Discipline + 4dF
3. **Check Control**: If control < power, take backlash
4. **Apply Effect**: Use controlled power for effect

### Willpower Usage
- Spend willpower to boost rolls
- Limited resource that doesn't refresh easily
- Critical for powerful magic

### Backlash
When you fail to control a spell:
- Take mental stress equal to uncontrolled power
- Can be mitigated with consequences
- May cause collateral damage (GM discretion)

## Recommended Modules
- **Dice So Nice**: For 3D dice animations
- **Token Action HUD**: Quick access to spells and skills
- **Combat Utility Belt**: Enhanced combat tracking

## Tips and Tricks

### For Players
- Keep track of your willpower carefully
- Consider consequences before big spells
- Use aspects for declarations and compels
- Remember social conflicts are just as powerful

### For GMs
- Use the compendium NPCs as templates
- Set scene aspects for locations
- Track faction relationships
- Use the Action Tracker for conflicts

## Troubleshooting

### Common Issues
1. **Compendiums not loading**: Run the import script manually
2. **Dresden tab missing**: Check actor type is "dresdenrpg"
3. **Rolls not working**: Ensure dresden-rolls.js is loaded

### Getting Help
- Check the [GitHub Issues](https://github.com/mscrnt/dresden-rpg/issues)
- Join the Foundry VTT Discord
- Review the Fate Core Official documentation

## Credits
- System Development: Kenneth Blossom
- Based on Fate Core Official by Richard Bellingham
- Dresden Files RPG © Evil Hat Productions
- Dresden Files © Jim Butcher

---
*"The building was on fire, and it wasn't my fault."*