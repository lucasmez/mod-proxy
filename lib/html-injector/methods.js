"use strict";

// If any property is added to 'this' change line 79 at selector.js
//properties to add: actions => [{onClose: true, do: doAppend, source: readStream}, {onClose: false, do:prepend, source: "hi"}]

function _addAction(actionFn, source, onClose) {
    //TODO check if source is string of stream
    
    var action = {onClose: (onClose || false), do: actionFn, source: source};
    
    if(Array.isArray(this.actions))
        this.actions.push(action);
    else
        this.actions = [action];
    
    return this;
}

function addMethod(name, openFn, closeFn) {
    var hasOpen = openFn && (typeof openFn === "function");
    var hasClose = closeFn && (typeof closeFn === "function");
    
    exports[name] = function(obj) {
        var ret;
        hasOpen && (ret = _addAction.call(this, openFn, obj));
        hasClose && (ret = _addAction.call(this, closeFn, obj, true));
        return ret;
    }
}

addMethod('append', null, append);
addMethod('after', null, after);
addMethod('before', before);
addMethod('prepend', prepend);
addMethod('replaceWith', replaceOpen, replaceClose);
addMethod('remove', removeOpen, removeClose);
//addMethod('html', htmlOpen, htmlClose);
//addMethod('attr', attr);


function replaceOpen(source, tag, push) {
    push(source);
    push(null, {replace: true})
}

function replaceClose(source, tag, push) {
    push(null, {replace: false});
}
/*
funcion htmlOpen(source, tag, push) {
    if(source === null) { //get
        push(tag);
        push(null, {buffer: myBuf});
    }
    
    else { //set
        push(tag);
        push(source);
        push(null, {replace: true});
    }
}

function htmlClose(source, tag, push) {
    if(source === null) { //get
        push(tag);
    }
    
    else { //set
        push(tag);
        push(null);
    }
}
*/

function removeOpen(source, tag, push) {
    push(null, {replace: true});
}

function removeClose(source, tag, push) {
    push(null, {replace: false});
}


function before(source, tag, push) {
    push(source);
    push(tag, true);
    return push(null);

}

function prepend(source, tag, push) {
    push(tag, true);
    push(source);
    return push(null);
}

function append(source, tag, push) {
    push(source);
    push(tag, true);
    push(null);
}

function after(source, tag, push) {
    push(tag, true);
    push(source);
    push(null);
}
