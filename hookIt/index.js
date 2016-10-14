"use strict";

function hookIt(subject, preName, postName) {
    preName = preName || "pre";
    postName = postName || "after";
    
    function Hook(subject) {
        this._subj = subject;
        this._pre = {};
        this._after = {};
    }
    
    Hook.prototype = Object.create(Object.getPrototypeOf(subject));
    
    Hook.prototype[preName] = function(fName, fn, parallel) {
        var isArray = Array.isArray(fn);
        fn = isArray ? fn : [fn];
        
        if(parallel && isArray) {
            fn = [parallelNext(fn)];    
        }
        
        if(this._pre[fName]) {
            this._pre[fName] = this._pre[fName].concat(fn);;
        } else {
            this._pre[fName] = fn;
        }
        return this;
    }
    
    Hook.prototype[postName] = function(fName, fn, parallel) {
        var isArray = Array.isArray(fn);
        fn = isArray ? fn : [fn];
        
        if(parallel && isArray) {
            fn = [parallelNext(fn)];    
        }
        
        if(this._after[fName]) {
            this._after[fName] = this._after[fName].concat(fn);;
        } else {
            this._after[fName] = fn;
        }
        return this;
    }  
    
    
    for(let prop in subject) {
        if(typeof subject[prop] !== "function") continue;

         Hook.prototype[prop] = function() {
            var args = arguments || [];
            // Create an array containing all _pre and _post hooks and subject's function in correct call order
            var allFunctions = (this._pre[prop] || []).concat(this._subj[prop], this._after[prop] || []);
           
            // Iterate through all hooks and subject's function
            function next() {
                var nextFn = allFunctions.shift() || function() {};
                return nextFn.apply(subject, args);
            }

            // Make the next() function available to all hooks and subject's function
            Array.prototype.push.call(args, next);
            return next(); // Initiate iteration
        }
  
     }
   
    return new Hook(subject);
}


function parallelNext(fnAr) {
    return function() {
        // The done callback will always be the last parameter
        var args = arguments || [];
        var argKeys = Object.keys(args);
        var done = args[argKeys[argKeys.length-1]];
        
        var parallelCount = fnAr.length;
        function next() {
            if(--parallelCount === 0) done();
        }
        
        Array.prototype.splice.call(args, -1, 1, next); // Replace done with next
        fnAr.forEach( function(fn) { // Call every function in fnAr
            fn.apply(this, args)
        }.bind(this));
    }
}