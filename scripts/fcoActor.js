export class fcoActor extends Actor {

    get visible(){
        if (this.type === "Thing" && game.system.showThings !== true){
            return false;
        } 
        else {
            return super.visible;
        }
    }

    // Override the standard createDialog to just spawn a character called 'New Actor'.
    static async createDialog (...args){
        let perm  = {"default":CONST.DOCUMENT_OWNERSHIP_LEVELS[game.settings.get("fate-core-official", "default_actor_permission")]};
        // Use the system ID as the actor type
        let actorType = game.system.id === "dresdenrpg" ? "dresdenrpg" : "fate-core-official";

        if (args[0].folder) {
            Actor.create({"name":game.i18n.localize("fate-core-official.newCharacter"), "folder":args[0].folder, "type":actorType, ownership: perm});
        } else {
            Actor.create({"name":game.i18n.localize("fate-core-official.newCharacter"), "type":actorType, ownership: perm});
        }
    }

    async rationaliseKeys(){
        if (this.type == "fate-core-official" || this.type == "dresdenrpg"){
            let types = ["aspects", "tracks", "stunts", "skills"];
            for (let type of types) {
                let block = this.system[type];
                let output= {};
                for (let item in block){
                    output[fcoConstants.tob64(block[item].name)] = block[item];
                }
                let oldKeys = JSON.stringify(Object.keys(block));
                let newKeys = JSON.stringify(Object.keys(output));
                if (oldKeys != newKeys){
                    await this.update({"system":{[type]:null}})
                    await this.update({"system":{[type]:output}})
                }    
            }
            for (let extra of this.items) {
                await extra.rationaliseKeys();
            }
        }
    }

    async _preCreate(...args){
        await super._preCreate(...args);

        if (this.type == "ModularFate" || this.type == "FateCoreOfficial"){
            // Use the system ID to determine the target type
            let targetType = game.system.id === "dresdenrpg" ? "dresdenrpg" : "fate-core-official";
            this.updateSource({type:targetType})
        }

        if (this?.system?.details?.fatePoints?.refresh === null||
            this?.system?.details?.fatePoints?.refresh === undefined &&
            (this.type == "fate-core-official" || this.type == "dresdenrpg")){
            this.updateSource(this.initialisefcoCharacter());
        }

        if (this.type == "fate-core-official" || this.type == "dresdenrpg" || this.type == "FateCoreOfficial" || this.type == "ModularFate"){
            let types = ["aspects", "tracks", "stunts", "skills"];
            for (let type of types) {
                let block = this.system[type];
                let output= {};
                for (let item in block){
                    output[fcoConstants.tob64(block[item].name)] = block[item];
                }
                let oldKeys = JSON.stringify(Object.keys(block));
                let newKeys = JSON.stringify(Object.keys(output));
                if (oldKeys != newKeys){
                    this.updateSource({"system":{[type]:null}})
                    this.updateSource({"system":{[type]:output}})
                }
            }
        }
    }

    static migrateData (data){
        // Convert all extra_tags to being extra_id.
        if (data.system && data.name){
            let toProcess = ["skills","stunts","aspects","tracks"];
            for (let item of toProcess){
                for (let sub_item in data.system[item]){
                    if (data.system[item][sub_item]?.extra_tag?.extra_id){
                        let id = data.system[item][sub_item]?.extra_tag?.extra_id;
                        delete data.system[item][sub_item].extra_tag;
                        data.system[item][sub_item].extra_id = id;
                    }
                };
            }
        }
        return super.migrateData(data);
    }

    async _preUpdate(data, options, user){
        await super._preUpdate(data, options, user);
        if (data.type == "ModularFate" || data.type == "FateCoreOfficial"){
            // Use the system ID to determine the target type
            data.type = game.system.id === "dresdenrpg" ? "dresdenrpg" : "fate-core-official"; 
        }
    }

    /** Methods for dealing with multiple shapes (sets of token and avatar artwork that can be easily switched between) 
     *  Designed to be triggered from a token HUD.
     * Shapes are stored in the fate-core-official.shapes flag of actors, 
    */
    getShape (shapeName){
        let shapes = this.getFlag("fate-core-official", "shapes");
        return fcoConstants.gbn(shapes, shapeName);
    }

    async deleteShape (shapeName){
        let shapes = foundry.utils.duplicate(this.getFlag("fate-core-official", "shapes"));
        let shape = fcoConstants.gkfn(shapes, shapeName);
        if (shape) {
            delete shapes[shape];
            await this.unsetFlag ("fate-core-official","shapes");
            await this.setFlag("fate-core-official","shapes", shapes);
        }
    }

    async changeShape (shapeName, token){
        // Get shape from list of shapes stored in flags
        let shape = this.getShape(shapeName);
        if (!shape || !this.isOwner) return;
        // Set avatar and token artwork for this token or actor accordingly
        // If we're a token actor we need to change the texture for the token.
        let name = shape.tokenName;
        if (!name) name = token.name; 
        let aName = shape.actorName;
        if (!aName) aName = token.actor.name; 

        // The list of valid animations is available as TextureTransitionFilter.TYPES. It returns an object like:
        /*
            {
                "FADE": "fade",
                "SWIRL": "swirl",
                "WATER_DROP": "waterDrop",
                "MORPH": "morph",
                "CROSSHATCH": "crosshatch",
                "WIND": "wind",
                "WAVES": "waves",
                "WHITE_NOISE": "whiteNoise",
                "HOLOGRAM": "hologram",
                "HOLE": "hole",
                "HOLE_SWIRL": "holeSwirl"
            }
        */

        if (token.document.actorLink == false) {
            // This is a token actor; change the token texture and token actor avatar
            if (!shape.tokenData) await token.document.update({"texture.src":shape.tokenImg, "name":name}, {animation: {transition: "morph", duration: 2000}});
            await token.actor.update({"img":shape.avatarImg})
        } else {
            // This is a real actor; change the token texture, the actor's prototype token texture, and the actor's avatar
            if (!shape.tokenData) await token.document.update({"texture.src":shape.tokenImg, "name":name}, {animation: {transition: "morph", duration: 2000}});
            await token.actor.update({"img":shape.avatarImg, name:aName, "prototypeToken.texture.src":shape.tokenImg});
        }
        if (shape.tokenData) {
                shape.tokenData.texture.src = shape.tokenImg;
                shape.tokenData.x = token.document.x;
                shape.tokenData.y = token.document.y;
                shape.tokenData.elevation = token.document.elevation;
                shape.tokenData.flags = token.document.flags;
            if (foundry.utils.isNewerVersion(game.version,"12.317") && shape.transition){
                await token.document.update(shape.tokenData, {animation: {transition: TextureTransitionFilter.TYPES[shape.transition], duration: 2000}});
            }   else {
                await token.document.update(shape.tokenData);
            }   
        }

        if (shape.extra_status){
            let extra_status = [];
            for (let update of shape.extra_status){
                let item = token.actor.items.get(update._id);
                if (item != undefined) {
                    extra_status.push(update);
                }
            }

            await token.actor.updateEmbeddedDocuments("Item", extra_status);
            for (let item of token.actor.items){
                if (item.system.active) await token.actor.updateFromExtra(item);
                if (!item.system.active) await token.actor.deactivateExtra(item);
            }
        }
    }

    async storeShape (shapeName, tokenImg, avatarImg, token, transition){
        if (!this.isOwner) return;
        let shapes = this.getFlag("fate-core-official", "shapes");
        // If no shapes stored in flags, initialise an empty object.
        if (!shapes) shapes = {};
        let existing = fcoConstants.gbn(shapes, shapeName);
        if (token.document.actorLink == false) {
            // This is a token actor; store the token texture and token actor avatar unless specific values provided
            if (!tokenImg) tokenImg = token.document.texture.src;
            if (!avatarImg) avatarImg = token.actor.img;
        } else {
            // This is a real actor; store the token texture and the actor's avatar
            if (!tokenImg) tokenImg = token.document.texture.src;
            if (!avatarImg) avatarImg = this.img;
        }
        let token_data = foundry.utils.duplicate(token.document);

        let extra_status = [];
        let items = token.actor.items;
        for (let item of items){
            let active = item.system.active;
            let id = item.id;
            extra_status.push({"_id":id, "system.active":active})
        }

        let response = "no";
        if (existing) response  = await fcoConstants.awaitYesNoDialog(shapeName, game.i18n.localize("fate-core-official.checkShapeOverwrite"));
        if (!existing || response == "yes"){
            // Safe to store this shape
            let newShape = {"name":shapeName, "tokenImg":tokenImg, "avatarImg":avatarImg, actorName:token.actor.name, tokenName:token.name, tokenData:token_data, extra_status:extra_status, transition:transition};
            shapes[fcoConstants.tob64(shapeName)] = newShape;
            await this.setFlag("fate-core-official", "shapes", shapes);
        }
    }
    /** End methods for dealing with multiple shapes */

    initialisefcoCharacter () {
        let actor = this;
        //Modifies the data of the supplied actor to add tracks, aspects, etc. from system settings, then returns the data.
        let working_data = actor.toJSON();
        // Logic to set up Refresh and Current
    
        let refresh = game.settings.get("fate-core-official", "refreshTotal");
    
        working_data.system.details.fatePoints.refresh = refresh;
        working_data.system.details.fatePoints.current = refresh;
        
        let p_skills=working_data.system.skills;
        
        //Check to see what skills the character has compared to the global skill list
            var skill_list = game.settings.get("fate-core-official","skills");
            // This is the number of skills the character has currently.
            //We only need to add any skills if this is currently 0,
            
            
            let skills_to_add = [];
    
            for (let w in skill_list){
                let w_skill = skill_list[w];
                let key = fcoConstants.gkfn(p_skills, w_skill.name);
                if (key){
                } else {
                    if(w_skill.pc){
                        skills_to_add.push(w_skill);
                    }
                }
            }
    
            if (skills_to_add.length >0){
                //Add any skills from the global list that they don't have at rank 0.
                skills_to_add.forEach(skill => {
                    skill.rank=0;
                    p_skills[skill.name]=skill;
                })
            }        
    
            let aspects = game.settings.get("fate-core-official", "aspects");
            let player_aspects = foundry.utils.duplicate(aspects);
            for (let a in player_aspects) {
                player_aspects[a].value = "";
            }
            //Now to store the aspect list to the character
            working_data.system.aspects = player_aspects;
        
            //Step one, get the list of universal tracks.
            let world_tracks = foundry.utils.duplicate(game.settings.get("fate-core-official", "tracks"));
            let tracks_to_write = working_data.system.tracks;
            for (let t in world_tracks) {
                let track = world_tracks[t];
                if (track.universal == true) {
                    tracks_to_write[t] = world_tracks[t];
                }
            }
            for (let t in tracks_to_write) {
                let track = tracks_to_write[t];
                //Add a notes field. This is a bit redundant for stress tracks,
                //but useful for aspects, indebted, etc. Maybe it's configurable whether we show the
                //notes or not for any given track. LATER NOTE: It is not.
                track.notes = "";
    
                //If this box is an aspect when marked, it needs an aspect.name data field.
                if (track.aspect == game.i18n.localize("fate-core-official.DefinedWhenMarked")
                    || track.aspect == "Defined When Marked"
                    || track.aspect == "when_marked"
                ) {
                    track.aspect = {};
                    track.aspect.name = "";
                    track.aspect.when_marked = true;
                    track.aspect.as_name = false;
                }
                if (track.aspect == "Aspect as Name" 
                    || track.aspect == "Name as Aspect" 
                    || track.aspect == game.i18n.localize("fate-core-official.AspectAsName") 
                    || track.aspect == game.i18n.localize("fate-core-official.NameAsAspect")
                    || track.aspect == "as_name"    
                ) {
                    track.aspect = {};
                    track.aspect.when_marked = false;
                    track.aspect.as_name = true;
                }
    
                //Initialise the box array for this track 
                if (track.boxes > 0) {
                    let box_values = [];
                    for (let i = 0; i < track.boxes; i++) {
                        box_values.push(false);
                    }
                    track.box_values = box_values;
                }
            }
        working_data.system.tracks = tracks_to_write;
        let tracks = working_data.system.tracks;
        let categories = game.settings.get("fate-core-official", "track_categories");
        //GO through all the tracks, find the ones with boxes, check the number of boxes and linked skills and initialise as necessary.
        for (let t in tracks) {
            let track = tracks[t];
    
            if (track.universal) {
                track.enabled = true;
            }
    
            // Check for linked skills and enable/add boxes as necessary.
            if (track.linked_skills != undefined && track.linked_skills.length > 0 && Object.keys(working_data.system.skills).length > 0) {
                let skills = working_data.system.skills;
                let linked_skills = tracks[t].linked_skills;
                let box_mod = 0;
                for (let i = 0; i < linked_skills.length; i++) {
                    let l_skill = linked_skills[i].linked_skill;
                    let l_skill_rank = linked_skills[i].rank;
                    let l_boxes = linked_skills[i].boxes;
                    let l_enables = linked_skills[i].enables;
    
                    //Get the value of the player's skill
                    let key = fcoConstants.gkfn(skills, l_skill)
                    if (!key){
    
                    }else {
                        let skill_rank = skills[key].rank;
                        //If this is 'enables' and the skill is too low, disable.
                        if (l_enables && skill_rank < l_skill_rank) {
                        track.enabled = false;
                    }
    
                    //If this adds boxes and the skill is high enough, add boxes if not already present.
                    //Telling if the boxes are already present is the hard part.
                    //If boxes.length > boxes it means we have added boxes, but how many? I think we need to store a count and add
                    //or subract them at the end of our run through the linked skills.
                        if (l_boxes > 0 && skill_rank >= l_skill_rank) {
                            box_mod += l_boxes;
                        }
                    }
                } //End of linked_skill iteration
                //Now to add or subtract the boxes
    
                //Only if this track works with boxes, though
                if (track.boxes > 0 || track.box_values != undefined) {
                    //If boxes + box_mod is greater than box_values.length add boxes
                    let toModify = track.boxes + box_mod - track.box_values.length;
                    if (toModify > 0) {
                        for (let i = 0; i < toModify; i++) {
                            track.box_values.push(false);
                        }
                    }
                    //If boxes + box_mod is less than box_values.length subtract boxes.
                    if (toModify < 0) {
                        for (let i = toModify; i < 0; i++) {
                            track.box_values.pop();
                        }
                    }
                }
            }
        }
        return working_data;
    }

    getHighest (data, test, extra_id){
        let count = 1;
        // Get the highest number on any item relating to this one.
        // data = aspects, stunts etc. test = aspect, stunt etc. name including integer if already applied
        for (let item in data){
            if (data[item].name == test){
                // If item = New Stunt, then New Stunt 2, New Stunt 3, etc. will all begin with this.
                // We need to find the highest number on other items that start with this name, and go one higher.
                // We should not add a number to ourselves if we're the only one that matches us.
                if (data[item]?.extra_id == extra_id){
                    // The item on the character sheet is from the extra being investigated; do nothing.
                } else {
                    // NOW we need to know how many other things there are that start with my name
                    for (let item2 in data){
                        if (data[item2].name.startsWith(test)){
                            // Increment the count, because this is something other than me that starts with the same name.
                            if (data[item2]?.extra_id !== extra_id){
                                count ++;
                            }
                        }
                    }
                }
            }
        }
        return count;
    }

    async updateFromExtra(itemData) {
        let actor = this;

        if (!itemData.active && !itemData.system.active) {
            // This currently adds the stuff to the character sheet even if active is false, which we do not want.
            return;
        }

        actor.sheet.editing = true;
            let extra = foundry.utils.duplicate(itemData);
    
            //Find each aspect, skill, stunt, and track attached to each extra
            //Add an extra data item to the data type containing the id of the original item.
            //Done: Edit editplayertracks to be blind to any object with the extra data type defined
            //Done: Edit editplayerskills to be blind to any object with the extra data type defined
            //Done: Edit editplayeraspects to be blind to any object with the extra data type defined
            //Check to see if the thing is already on the character sheet. If it is, update with the version from the item (should take care of diffing for me and only do a database update if changed)
            //Done: Remove the ability to delete stunts bestowed upon the character by their extras (disable the delete button if extra_id != undefined)
            
            let stunts_output = {};
            let skills_output = {};
            let aspects_output = {};
            let tracks_output = {};
    
                let extra_name = extra.name;
                let extra_id = extra._id;
    
                let stunts = foundry.utils.duplicate(extra.system.stunts);
        
                if (!Array.isArray(stunts)){
                    for (let stunt in stunts){
                        let count = this.getHighest(actor.system.stunts, stunts[stunt].name, extra_id);
                        if (count > 1) {
                            let count2 = this.getHighest(stunts, stunts[stunt].name, extra_id);
                            // Count is the number of things starting with this on the actor
                            // Count2 is the number of things starting with this on the extra
                            // Do I just use the higher value? I think that will work
                            if (count2 > count) count = count2
                        }

                        stunts[stunt].extra_id = extra_id;
                        stunts[stunt].original_name = stunts[stunt].name;
                        
                        if (count > 1){    
                            stunts[stunt].name = stunts[stunt].name + ` ${count}`;
                        }
                        stunts_output[fcoConstants.tob64(stunts[stunt].name)]=stunts[stunt];
                    }
                }

                let skills = foundry.utils.duplicate(extra.system.skills);
                if (!Array.isArray(skills)){
                    let askills = foundry.utils.duplicate(actor.system.skills);  
                    for (let skill in skills){
                        let hidden = skills[skill].hidden;
                        // If this and its constituent skills are NOT set to combine skills, we need to create an entry for this skill.
                        if (!extra.system.combineSkills && !skills[skill].combineMe){
                            let count = this.getHighest(askills, skills[skill].name, extra_id);

                            skills[skill].original_name = skills[skill].name;
                            skills[skill].extra_id = extra_id;
                            

                            if (count > 1) {
                                let count2 = this.getHighest(skills, skills[skill].name, extra_id);
                                // Count is the number of things starting with this on the actor
                                // Count2 is the number of things starting with this on the extra
                                // Do I just use the higher value? I think that will work
                                if (count2 > count) count = count2;
                                skills[skill].name = skills[skill].name + ` ${count}`;
                            }
                            skills_output[fcoConstants.tob64(skills[skill].name)]=skills[skill];
                        } else {
                            // We need to ensure the combined skills are setup correctly; if we've just removed the setting here then we need to rebuild
                            // We need to build all the combined skills here and make sure that they're returned properly in skills_output
                            let combined_skill;
                            for (let ask in askills){
                                if (askills[ask].name == skills[skill].name){
                                    // This is the skill that everything is being merged into; 
                                    // only the skill with the raw name of the extra_skill works for merging 
                                    combined_skill = askills[ask];
                                    if (combined_skill) combined_skill = foundry.utils.duplicate(combined_skill);                                    
                                }
                            }
                            if (combined_skill && !combined_skill.extra_id){
                                // The skill is a real one from the character and we cannot combine with it.
                            } else {
                                // If it is null, it needs to be created. That can only happen if this extra is newly creating a merged skill.
                                if (!combined_skill){
                                    combined_skill = foundry.utils.duplicate(skills[skill]);
                                    combined_skill.extra_id = extra_id;
                                }
                                // Now we know for a fact that the base combined_skill is there and we have a reference to it, we can set its ranks & hidden status:
                                // Combined skills should only be hidden if ALL the skills that combine are set to hidden.
                                if (combined_skill){
                                    combined_skill.rank = 0;
                                    for (let extra of this.items){
                                        if (extra.system.active){
                                            if (extra.system.combineSkills || extra.system.skills[skill]?.combineMe || combined_skill.extra_id == extra.id){
                                                let esk = extra.system.skills[skill];
                                                if (esk){
                                                    if (!esk.hidden) hidden = false;
                                                    combined_skill.rank += esk.rank;
                                                    combined_skill.hidden = hidden;
                                                }
                                            }
                                        }
                                    }
                                    skills_output[fcoConstants.tob64(combined_skill.name)] = combined_skill;
                                }
                            }
                        }
                    }
                }
                let aspects = foundry.utils.duplicate(extra.system.aspects);

                if (!Array.isArray(aspects)){
                    for (let aspect in aspects){
                        let count = this.getHighest(actor.system.aspects, aspects[aspect].name, extra_id);
                        
                        aspects[aspect].original_name = aspects[aspect].name;
                        aspects[aspect].extra_id = extra_id;
                        
                        if (count > 1){
                            let count2 = this.getHighest(aspects, aspects[aspect].name, extra_id);
                            if (count2 > count) count = count2;
                            aspects[aspect].name = aspects[aspect].name + ` ${count}`;
                        }
                        aspects_output[fcoConstants.tob64(aspects[aspect].name)]=aspects[aspect];
                    }
                }
                
                let tracks = foundry.utils.duplicate(extra.system.tracks);
                if (!Array.isArray(tracks)){
                    for (let track in tracks){
                        let count = this.getHighest(actor.system.tracks, tracks[track].name, extra_id);
                        
                        tracks[track].original_name = tracks[track].name;
                        tracks[track].extra_id = extra_id;
                        
                        if (count >1 ){
                            let count2 = this.getHighest(tracks, tracks[track].name, extra_id);
                            if (count2 > count) count = count2;
                            tracks[track].name = tracks[track].name +` ${count}`;
                        }
                        tracks_output[fcoConstants.tob64(tracks[track].name)]=tracks[track];
                    }        
                }
    
            let actor_stunts = foundry.utils.duplicate(actor.system.stunts);
    
            let actor_tracks = foundry.utils.duplicate(actor.system.tracks);
    
            //Look for orphaned tracks on the character that aren't on the item any longer and delete them from the character
            //Find all tracks on this actor that have the item's ID in their extra_id attribute
            //Check to see that those tracks are also on the item's list of tracks
            //If they aren't, delete them from the character.
    
            let update_object = {};
    
            for (let t in actor_tracks){
                let track = actor_tracks[t];
                if (track.extra_id != undefined && track.extra_id == extra_id){
                    let tr = fcoConstants.gbn(tracks_output, track.name);
                    if (!tr){
                        update_object[`system.tracks.-=${t}`] = null;
                    }
                }
            }
    
            for (let track in tracks_output){
                let tr = fcoConstants.gbn(actor_tracks, tracks_output[track].name)
                if (tr){
                    for (let i = 0; i < tracks_output[track]?.box_values?.length; i++){
                        tracks_output[track].box_values[i] = tr.box_values[i];
                    }
                    if (tr?.when_marked && tracks_output[track].aspect?.name) tracks_output[track].aspect.name = tr.aspect?.name;
                    if (tr?.notes) tracks_output[track].notes = tr.notes;
                }
            }
            
            let actor_aspects = foundry.utils.duplicate(actor.system.aspects);
    
            //Ditto for orphaned aspects
            for (let a in actor_aspects){
                let aspect = actor_aspects[a];
                if (aspect != undefined && aspect.extra_id != undefined && aspect.extra_id == extra_id){
                    let as = fcoConstants.gbn(aspects_output, aspect.name);
                    if (!as){
                        update_object[`system.aspects.-=${a}`] = null;
                    }
                }
            }
    
            let actor_skills = foundry.utils.duplicate(actor.system.skills);
    
            //Ditto for orphaned skills
            for (let s in actor_skills){
                let skill = actor_skills[s];
                if (skill != undefined && skill.extra_id != undefined && skill.extra_id == extra_id){
                    let sk = fcoConstants.gbn(skills_output, skill.name);
                    if (!sk){
                        update_object[`system.skills.-=${s}`] = null;
                    }
                }
            }
    
            //Ditto for orphaned stunts
            for (let s in actor_stunts){
                let stunt = actor_stunts[s];
                if (stunt != undefined && stunt.extra_id != undefined && stunt.extra_id == extra_id){
                    let st = fcoConstants.gbn(stunts_output, stunt.name);
                    if (!st){
                        update_object[`system.stunts.-=${s}`] = null;;
                    }
                }
            }
            actor.sheet.editing = false;
            await actor.update(update_object);

            let final_stunts = foundry.utils.mergeObject(actor.system.stunts, stunts_output, {"inPlace":false});
            let working_tracks = foundry.utils.mergeObject(actor.system.tracks, tracks_output, {"inPlace":false});
            let final_skills = foundry.utils.mergeObject(actor.system.skills, skills_output, {"inPlace":false});
            let final_aspects = foundry.utils.mergeObject(actor.system.aspects, aspects_output, {"inPlace":false});
            let final_tracks = this.setupTracks (foundry.utils.duplicate(final_skills), foundry.utils.duplicate(working_tracks));

            await actor.update({    
                "system.tracks":final_tracks,
                "system.aspects":final_aspects,
                "system.skills":final_skills,
                "system.stunts":final_stunts
            })
    }

    async deactivateExtra (item, deleting){
        this.sheet.editing = true;
        let actor = this;
        let itemData = item;
        if (deleting == undefined) deleting = true;

        //Add a parameter - 'deleting' - if false, push the existing track on the actor back to the extra
        //before removing it - if the extra is toggled on and off, any tracks on the character that are partially
        //filled in should remain that way. This should be as simple as adding a parameter to calls to this method
        //and then removing extra_id from each track and writing it back to the item in an update call.
        if (!deleting){
            let trackUpdates = foundry.utils.duplicate(item.system.tracks);
            let tracks = actor?.system?.tracks;

            for (let t in trackUpdates){
                // Need to grab the original name from the ACTOR, not from the extra. So we need to reverse the order of operations here
                // to search through the actor's tracks to find one with an original name that matches this track.
                for (let at in tracks){
                    let name = tracks[at]?.original_name;
                    if (name == trackUpdates[t].name && tracks[at]?.extra_id == item.id){
                        let track = foundry.utils.duplicate(tracks[at]);
                        track.name = name;
                        delete track.extra_id;
                        delete track.original_name;
                        trackUpdates[t] = track;
                    }
                }
            }
            let stuntUpdates = foundry.utils.duplicate(item.system.stunts);
            let stunts = actor?.system?.stunts;
            for (let s in stuntUpdates){
                for (let as in stunts){
                    let name = stunts[as]?.original_name;
                    if (name == stuntUpdates[s].name && stunts[as]?.extra_id == item.id){
                        let stunt = foundry.utils.duplicate(stunts[as]);
                        stunt.name = name;
                        delete stunt.extra_id;
                        delete stunt.original_name;
                        stuntUpdates[s] = stunt;
                    }
                }
            }
            await item.update({"system.tracks":trackUpdates, "system.stunts":stuntUpdates},{renderSheet:false});
        }
        //Clean up any tracks, aspects, skills, or stunts that were on this extra but are now orphaned.
    
        let updateObject = {}
    
        let actor_aspects = foundry.utils.duplicate(actor.system.aspects)
    
        for(let aspect in actor_aspects)
        {
            if ( actor_aspects[aspect]?.extra_id == itemData._id){
                updateObject[`system.aspects.-=${aspect}`] = null;
            }
        }
        
        let actor_stunts = foundry.utils.duplicate(actor.system.stunts)
    
        for (let stunt in actor_stunts){
            if (actor_stunts[stunt]?.extra_id == itemData._id){
                updateObject[`system.stunts.-=${stunt}`] = null;
            }
        }
    
        let actor_tracks = foundry.utils.duplicate(actor.system.tracks)
    
        for (let track in actor_tracks){
            if (actor_tracks[track]?.extra_id == itemData._id){
                updateObject[`system.tracks.-=${track}`] = null;
            }
        }
    
        let actor_skills = foundry.utils.duplicate(actor.system.skills)
    
        for (let skill in actor_skills){
            if (actor_skills[skill]?.extra_id == itemData._id){
                updateObject[`system.skills.-=${skill}`] = null;
            }
        }      

        actor.sheet.editing = false;
        await actor.update(updateObject);
        let ctracks = foundry.utils.duplicate(actor.system.tracks);
        let cskills = foundry.utils.duplicate(actor.system.skills);
        let etracks = actor.setupTracks(cskills, ctracks);
        await actor.update({"system.tracks":etracks});
        // This is required in order to make sure we get the combined skills setup correctly
        for (let extra of actor.items){
            if (extra.id != item.id && extra.system.active) await actor.updateFromExtra(extra);
        }
        this.render(false);
    }
    
    async rollSkill (skillName){
        let actor = this;
        let skill = fcoConstants.gbn(actor.system.skills, skillName);
        if (skill){
            let rank = skill.rank;
            let r = new Roll(`4dF + ${rank}`);
            let fcoc = new fcoConstants();
            let ladder = fcoc.getFateLadder();
            let rankS = rank.toString();
            let rung = ladder[rankS];
            let roll = await r.roll();
            roll.dice[0].options.sfx = {id:"fate4df",result:roll.result};

            let msg = ChatMessage.getSpeaker({actor:actor})
            msg.alias = actor.name;

            roll.toMessage({
                flavor: `<h1>${skill.name}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                        ${game.i18n.localize("fate-core-official.SkillRank")}: ${rank} (${rung})`,
                speaker: msg,
            });
        }
    }

    async rollTrack (trackName){
        let actor = this;
        let track = fcoConstants.gbn(actor.system.tracks, trackName);
        if (track){
            let rank = 0;
            if (track.rollable == "full"){
                // Get the number of full boxes
                for (let i = 0; i < track.box_values.length; i++){
                    if (track.box_values[i]) rank++;
                }
            }
            if (track.rollable == "empty"){
                // Get the number of empty boxes
                for (let i = 0; i < track.box_values.length; i++){
                    if (!track.box_values[i]) rank++;
                }
            }
            if (track.rollable != "empty" && track.rollable != "full") return;

            let r = new Roll(`4dF + ${rank}`);
            let fcoc = new fcoConstants();
            let ladder = fcoc.getFateLadder();
            let rankS = rank.toString();
            let rung = ladder[rankS];
            let roll = await r.roll();
            roll.dice[0].options.sfx = {id:"fate4df",result:roll.result};

            let msg = ChatMessage.getSpeaker({actor:actor})
            msg.alias = actor.name;

            roll.toMessage({
                flavor: `<h1>${track.name}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                        ${game.i18n.localize("fate-core-official.Boxes")}: ${rank} (${rung})`,
                speaker: msg,
            });
        }
    }

    async rollModifiedTrack (trackName) {
        let actor = this;
        let track = fcoConstants.gbn(actor.system.tracks, trackName);
        if (track){
            if (track.rollable == "full" || track.rollable == "empty"){
                let mrd = new ModifiedRollDialog(this, trackName, true);
                mrd.render(true);
                try {
                    mrd.bringToTop();
                } catch  {
                    // Do nothing.
                }
            } 
        }
    }

    async rollStunt(stuntName){
        let stunt = fcoConstants.gbn(this.system.stunts, stuntName);
        if (stunt){   
            let skill = stunt.linked_skill;
            let bonus = parseInt(stunt.bonus);
    
            let fcoc = new fcoConstants();
            let ladder = fcoc.getFateLadder();
            let rank = 0;
            if (skill == "Special"){
                // We need to pop up a dialog to get a skill to roll.
                //TODO: Consider whether should be able to select a 'No Skill option' to roll at Mediocre.
                let skills = [];
                for (let x in this.system.skills){
                    skills.push(this.system.skills[x].name);
                }
                let sk = await fcoConstants.getInputFromList (game.i18n.localize("fate-core-official.select_a_skill"), skills);
                skill = fcoConstants.gbn(this.system.skills, sk);
                rank = skill?.rank;
            } else {
                //TODO: Consider whether should be able to roll a skill they don't have at Mediocre.
                skill = fcoConstants.gbn(this.system.skills, skill);
                if (!skill) return;
                rank = skill?.rank;
            }
    
            let rankS = rank.toString();
            let rung = ladder[rankS];
    
            let r = new Roll(`4dF + ${rank}+${bonus}`);
            let roll = await r.roll();
            roll.dice[0].options.sfx = {id:"fate4df",result:roll.result};
    
            let msg = ChatMessage.getSpeaker({actor:this})
            msg.alias = this.name;
    
            roll.toMessage({
                flavor: `<h1>${skill.name}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                ${game.i18n.localize("fate-core-official.SkillRank")}: ${rank} (${rung})<br> 
                ${game.i18n.localize("fate-core-official.Stunt")}: ${stunt.name} (+${bonus})`,
                speaker: msg
            });
        }
    }
    
    async rollModifiedSkill (skillName) {
        if (skillName){
            let mrd = new ModifiedRollDialog(this, skillName);
            mrd.render(true);
            try {
                mrd.bringToTop();
            } catch  {
                // Do nothing.
            }
        }
    }

    prepareData(...args){
        super.prepareData(...args);
        if (this.type == "fate-core-official" || this.type == "dresdenrpg"){
            this.system.details.fatePoints.max = this.system.details.fatePoints.refresh;
            this.system.details.fatePoints.value = this.system.details.fatePoints.current;

            let tracks = this.system.tracks;
            for (let track in tracks){
                if (tracks[track].box_values){
                    this.system.details[tracks[track].name] = {max:tracks[track].box_values.length, value:tracks[track].box_values.length-tracks[track].box_values.filter(b => b).length};
                }
            }
        }
    }

    setupTracks (skills, tracks) {
        // This method takes skill and track data and returns corrected tracks enabled and disabled etc. according to the values of those skills
        // and the tracks' settings for enabling/disabling tracks according to skill ranks.

        let categories = game.settings.get("fate-core-official", "track_categories");
        //GO through all the tracks, find the ones with boxes, check the number of boxes and linked skills and initialise as necessary.
        for (let t in tracks) {
            let track = tracks[t];

            if (track.universal) {
                track.enabled = true;
            }

            // Check for linked skills and enable/add boxes as necessary.
            if (track.linked_skills != undefined && track.linked_skills.length > 0 && Object.keys(skills).length > 0) {
                track.enabled = false;
                let linked_skills = tracks[t].linked_skills;
                let box_mod = 0;
                for (let i = 0; i < linked_skills.length; i++) {
                    let l_skill = linked_skills[i].linked_skill;
                    let l_skill_rank = linked_skills[i].rank;
                    let l_boxes = linked_skills[i].boxes;
                    let l_enables = linked_skills[i].enables;

                    //Get the value of the player's skill
                    let skill = fcoConstants.gbn(skills, l_skill);
                    if (!skill && l_enables == false){
                        if (l_boxes > 0) {
                            track.enabled = true;
                        }
                    }else {
                        let skill_rank = skill?.rank;
                        //If this is 'enables' and the skill is high enough, enable.
                        if (l_enables && skill_rank >= l_skill_rank) {
                            track.enabled = true;
                        }
                    //If this adds boxes and the skill is high enough, add boxes if not already present.
                    //Telling if the boxes are already present is the hard part.
                    //If boxes.length > boxes it means we have added boxes, but how many? I think we need to store a count and add
                    //or subract them at the end of our run through the linked skills.
                        
                        if (l_boxes > 0 ) {
                            if (l_enables == false) track.enabled = true;
                            if (skill_rank >= l_skill_rank){
                                box_mod += l_boxes;
                            }
                        }
                    }
                } //End of linked_skill iteration
                //Now to add or subtract the boxes

                //Only if this track works with boxes, though
                if (track.boxes > 0 || track.box_values != undefined) {
                    //If boxes + box_mod is greater than box_values.length add boxes
                    let toModify = track.boxes + box_mod - track.box_values.length;
                    if (toModify > 0) {
                        for (let i = 0; i < toModify; i++) {
                            track.box_values.push(false);
                        }
                    }
                    //If boxes + box_mod is less than box_values.length subtract boxes.
                    if (toModify < 0) {
                        for (let i = toModify; i < 0; i++) {
                            track.box_values.pop();
                        }
                    }
                }
            }
        }
        return tracks;
    }

    get skills (){
        return this.system.skills;
    }
}

    /** HUD interface for changing shape */

    Hooks.on('renderTokenHUD', function (hudButtons, html, data) {
        //hudButtons.object is the token itself.
        let token = hudButtons.object;
        if (token.actor.type != "fate-core-official" && token.actor.type != "dresdenrpg") return;
        let shapes = token.actor.getFlag("fate-core-official","shapes");
        let transitions = "";

        if (foundry.utils.isNewerVersion(game.version, "12.317")){
            transitions = `<select id="fcotransition_${token.id}" style="min-height: 1.5em; background-color:var(--fco-sheet-input-colour); color:var(--fco-sheet-text-colour); font-family: var(--fco-font-family); left:75px;">`
            for (let transition in TextureTransitionFilter.TYPES){
                let selected="";
                if (transition == "FADE") selected = `selected = "selected"`;   
                transitions += `<option value = "${transition}" ${selected}>
                    ${TextureTransitionFilter.TYPES[transition]}
                </option>`
            }
            transitions += `</select>`
        }

        let shapeButtons = `<div style="font-size:0.8em; position:absolute; min-width:450px; max-width:450px; text-overflow: ellipsis; overflow-x:auto; max-height:1000px; overflow-y:auto; left:75px; top:-75px; display:flex-row"><table style="background:transparent;">
        <tr style="background-color:var(--fco-accent-colour); height:75px; border:none">
            <td width = "300px">
                <input type="text" style="font-size:0.8em; margin-left:10px; margin-right:10px; max-width:225px; background:var(--fco-foundry-interactable-color); color:var(--fco-sheet-text-colour)" id = fcoShapeAddName_${token.id}></input>
            </td>
            <td width ="100px">
                ${transitions}
            </td>
            <td width = "50px">
                <div style="width:50px" id="fcoShapeAdd_${token.id}"><i class="fas fa-plus fu_button"></i></div>
            </td>
        </tr>
        </table>`;
        let allowDeletion = true;
        let deleteButton = "";
        
        for (let shape in shapes){
            if (allowDeletion) deleteButton=`<td width="50px"><div class= "fu_button" id="fcoShapeDelete_${token.id}_${shape}"><i icon class ="fas fa-trash"</i></div></td>`
            shapeButtons += `<div class="fu_button" style="background:var(--fco-sheet-background-colour); display:flex; left:75px; padding:10px; min-width:400px; margin:5px; color:black; font-family:var(--fco-font-family)" id="fcoShape_${token.id}_${shape}">
            <table style="background:transparent; border:none; color:black; font-family:var(--fco-font-family)">
                <tr>
                    <td style="color:var(--fco-sheet-text-colour); padding-left:5px; text-align:left; min-width:100px; max-width:100px; overflow:hidden; text-overflow:ellipsis;">${shapes[shape].name}</td>
                    <td width="80px"><img src="${shapes[shape].tokenImg}" style= "min-width:75px; height:75px; opacity:1 !important"></img></td>
                    <td width "80px"><img src="${shapes[shape].avatarImg}" style= "min-width:75px; height:75px; opacity:1 !important"></img></td>
                    ${deleteButton}
                </tr>
            </table>
            </div>`
        }
        shapeButtons += `</div>`
        let button = $(`<div class="control-icon fco-changeShape" id="fco-changeShape"><i class="fa fa-arrows-rotate"></i></div>`);
        let col = html.find('.col.right');
        col.prepend(button);

        button.click(async (ev) => {
            if (ev.target.closest('div').id.split("_")[0] == "fcoShapeDelete"){
                let shapes = token.actor.getFlag("fate-core-official","shapes");
                let shape = shapes[ev.target.closest('div').id.split("_")[2]];
                let del = await fcoConstants.confirmDeletion();
                if (del){
                    await token.actor.deleteShape(shape.name)
                }
            } else {
                if (ev.target.closest('div').id.split("_")[0] == "fcoShapeAdd"){
                    let name = $(`#fcoShapeAddName_${token.id}`)[0].value;
                    let transition = null;
                    if (foundry.utils.isNewerVersion(game.version, "12.317")) transition = $(`#fcotransition_${token.id}`)[0].value;
                    if (name) {
                        await token.actor.storeShape(name, null, null, token, transition);
                    } else {
                        ui.notifications.error(game.i18n.localize("fate-core-official.empty"));
                    }
                } else {
                    let shapes = token.actor.getFlag("fate-core-official","shapes");
                    if (ev.target.closest('div').id == "fco-changeShape") button.append(shapeButtons);
                    let shape = undefined;
                    if (shapes) shape = shapes[ev.target.closest('div').id.split("_")[2]];
                    if (shape) await token.actor.changeShape(shape.name, token);
                }
            }
        });
    });
    
    /** End HUD interface for changing shape */
