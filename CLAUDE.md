# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dresden RPG is a Foundry VTT game system adapted from Fate Core Official to support the Dresden Files Role-Playing Game. It's a vanilla JavaScript project with no build process - changes are directly made to source files and tested in Foundry VTT.

## Development Workflow

### Testing Changes
1. Edit JavaScript, CSS, or HTML files directly
2. Reload Foundry VTT (or rely on hot reload for CSS/HTML/HBS/JSON)
3. Create/use a test world with the dresden-rpg system
4. Test functionality in-game

### No Build Commands
This is not a Node.js project - there's no package.json, no npm scripts, no build process. Development involves direct file editing.

## Architecture

### Entry Points
- `fco.js` - Main ES module loaded by Foundry
- `scripts/fcoConstants.js` - Core constants and configuration
- Scripts loaded sequentially as defined in `system.json`

### Key Modules
- **Actor System**: `fcoActor.js` - Extends Foundry's Actor document
- **Character Sheet**: `fcoCharacter.js` - Character sheet implementation
- **Item System**: `fcoExtra.js` - Extra items functionality
- **GM Tools**: `FateUtilities.js` - GM utility window
- **World Configuration**: `ManageSkills.js`, `ManageAspects.js`, `ManageTracks.js`

### Document Types
- **Actors**: `dresden-rpg` (main character type), `ModularFate`, `Thing`
- **Items**: `Extra` (supports HTML description fields)

### Important Patterns
1. **Localization**: Use `game.i18n.localize("fate-core-official.key")` for all user-facing strings
2. **HTML Fields**: Several fields support HTML - these are sanitized server-side by Foundry
3. **World Settings**: Skills, aspects, and tracks are configured at world level, then applied to actors
4. **Hot Reload**: CSS, HTML, HBS, and JSON files auto-reload; JavaScript requires manual reload

### Foundry API Considerations
- Minimum Foundry version: v12
- Use `foundry.utils` instead of deprecated utility methods
- Follow Foundry's document update patterns (e.g., `actor.update()` not direct property assignment)
- Hook into Foundry lifecycle events (ready, renderActorSheet, etc.)

## Current Development Focus

The system is being adapted from Fate Core Official to Dresden Files RPG. Key differences include:
- Custom stress tracks for Dresden Files
- Modified skill list specific to the Dresden universe
- Additional consequence and condition tracking
- Magic system integration (in development)

When making changes, ensure compatibility with existing Fate Core Official features while adding Dresden-specific functionality.