"use strict";

const methods = require('./methods');

module.exports = selector;
    
function selector() {
    var newSel = Object.create(selector);
    
    newSel.modifiers = {};
    newSel.$ = newSel.$.bind(newSel);
    
    return newSel;
};

selector.$ = function(selector) {
    var sel = this.parseSelector(selector.trim());
    
    if(!sel) {  // If not a valid selector
        return null; 
    }
    
    var tagName = sel.name || 'none';
    var newMod = Object.create(methods);
   
    for(var prop in sel) {
        if(!sel.hasOwnProperty(prop) || prop === "name")
            continue;
        
        newMod[prop] = sel[prop];
    }
        
    if(this.modifiers[tagName])
        this.modifiers[tagName].push(newMod);
    else 
        this.modifiers[tagName] = [newMod];
  
    return newMod;
};


//Example input: '<div class="class1 class2" id="id1 id2" data-att="hi">'
selector.match = function(elementString) {
    
    var spaceIndex = elementString.indexOf(' ');
    var tagName = elementString.slice(1, spaceIndex);
    elementString = elementString.slice(spaceIndex + 1);
    
    var elem = this.modifiers[tagName];
    var none = this.modifiers.none;
    if(!elem && !none) {
        return [];
    }
    
    // This pattern matches spaces separated html attributes
    //Used after name '<tagName' has been extracted and removed
    var pattern = /(\s?[^=]*)=['"]([^=]*)['"][\s?>]/g;
    
    var match, el = {};
    while((match = pattern.exec(elementString))) {
        //match[1] contains the attribute name. match[2] contains its contents separated by spaces
        if(match[1] === 'id' || match[1] === 'class')
            el[match[1]] = match[2].split(' ');
        else
            el[match[1]] = match[2]
    } 
 
    
    var matches = []; //Array to be returned
    elem && elem.forEach( (element) => {
       if(_isMatch(element, el)) 
           matches.push(element);
    });
    
    none && none.forEach( (element) => {
       if(_isMatch(element, el)) 
           matches.push(element);
    });
    
    return matches;
    
};

function _isMatch(mod, elem) {
    var skip = ['actions'];
    var keysLength = Object.keys(mod).length;
    
    if(!keysLength || (keysLength === skip.length && skip.every( (ski) => { return (ski in mod);  })))
        return true;
    
    var isMatch = false;

    for(var prop in mod) {
        if(!mod.hasOwnProperty(prop) || skip.indexOf(prop) !== -1) 
            continue;
        if(Array.isArray(mod[prop])) {
            isMatch = mod[prop].every( (propName) => {
                return elem[prop] && (elem[prop].indexOf(propName) > -1);
            });
        }
        else {
            isMatch = (mod[prop] === elem[prop]);
        }
    }
    
    return isMatch;
        
}

//Example input: "<div.class1.class2#id1[attr='at1']#id>"
selector.parseSelector = function(selector) {
    if(!selector || !selector.length)   // No argument
        return null;
    
    var sel = {
        name: null,
        attr: [],
        class: [],
        id: []
    };
    
    var keyChars = {
        'name': 'name',
        '#': 'id', 
        '.': 'class', 
        '[': 'attr',
        ']': ""
    };
    
    var type = "name", startIndex = 0, insideQuotes = false;
    
    for(var i=0; i<selector.length; i++) {
        var char = selector[i];
        
        if(!(char in keyChars) || insideQuotes) {
            if(char === '\'' || char === '"')
                insideQuotes = !insideQuotes;
            continue;
        } 
        
       
        if(type.length) {
            if(type === 'name')
                sel[type] = selector.slice(startIndex, i);
            else
                sel[type].push(selector.slice(startIndex, i));
        }
        
        type = keyChars[char];
        startIndex = i+1;
        
        
    }

    if(i === selector.length && type === "name")    // No attributes, id or class
        sel.name = selector;
    
    else if(selector.slice(startIndex).length)
        sel[type.length ? type : 'attr'].push(selector.slice(startIndex));
  
    sel.attr.forEach( (attr) => {
        var attrArray = attr.split('=');
        sel[attrArray[0]] = attrArray[1].slice(1,-1);
    });
    
    delete sel.attr;
    if(!sel.id.length) delete sel.id;
    if(!sel.class.length) delete sel.class;

    return sel;
};

