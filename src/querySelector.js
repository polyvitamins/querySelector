define(function() {
	/*
	IE не поддерживает scope: в querySelector, поэтому требуется альтернативное решение.
	Решение найдено здесь: https://github.com/lazd/scopedQuerySelectorShim
	*/

	(function() {
	  if (!HTMLElement.prototype.querySelectorAll) {
	    throw new Error('rootedQuerySelectorAll: This polyfill can only be used with browsers that support querySelectorAll');
	  }

	  // A temporary element to query against for elements not currently in the DOM
	  // We'll also use this element to test for :scope support
	  var container = document.createElement('div');

	  // Check if the browser supports :scope
	  try {
	    // Browser supports :scope, do nothing
	    container.querySelectorAll(':scope *');
	  }
	  catch (e) {
	    // Match usage of scope
	    var scopeRE = /^\s*:scope/gi;

	    // Overrides
	    function overrideNodeMethod(prototype, methodName) {
	      // Store the old method for use later
	      var oldMethod = prototype[methodName];

	      // Override the method
	      prototype[methodName] = function(query) {
	        var nodeList,
	            gaveId = false,
	            gaveContainer = false;

	        if (query.match(scopeRE)) {
	          // Remove :scope
	          query = query.replace(scopeRE, '');

	          if (!this.parentNode) {
	            // Add to temporary container
	            container.appendChild(this);
	            gaveContainer = true;
	          }

	          parentNode = this.parentNode;

	          if (!this.id) {
	            // Give temporary ID
	            this.id = 'rootedQuerySelector_id_'+(new Date()).getTime();
	            gaveId = true;
	          }

	          // Find elements against parent node
	          nodeList = oldMethod.call(parentNode, '#'+this.id+' '+query);

	          // Reset the ID
	          if (gaveId) {
	            this.id = '';
	          }

	          // Remove from temporary container
	          if (gaveContainer) {
	            container.removeChild(this);
	          }

	          return nodeList;
	        }
	        else {
	          // No immediate child selector used
	          return oldMethod.call(this, query);
	        }
	      };
	    }

	    // Browser doesn't support :scope, add polyfill
	    overrideNodeMethod(HTMLElement.prototype, 'querySelector');
	    overrideNodeMethod(HTMLElement.prototype, 'querySelectorAll');
	  }
	}());

	return function(query, root) {
		var prefix;
		(root) ? (prefix=':scope ') : (prefix=''); 
		var root = root||document;

		switch(typeof query) {
			case 'string':
				var queryExpr = /<([a-zA-Z0-9_]+) \/>/i,
				argsExpr = /\[([a-zA-Z0-9_\-]*)[ ]?=([ ]?[^\]]*)\]/i;

				if (query.indexOf('[')>-1 && argsExpr.exec(query)) {
					/*
					Значения в запросах по поиск аттрибутов необходимо возводить в ковычки
					*/
					var patch = true;
					query = query.replace(argsExpr, "[$1=\"$2\"]");
				} 

				if (queryExpr.exec(query) === null) {
					if (query.length===0) return new Array();
					
					// Нативный селектор
					try {
						return root.querySelectorAll(prefix+query);
					} catch(e) {
						throw 'querySelectorAll not support query: '+query;
					}
								
				} else {
					return [document.createElement(result[1].toUpperCase())];
				};
			break;
			case 'function':
				return [];
			break;
			case 'object':
				
				if (query instanceof Array) {
					
					return query;
				} if (query===null) {
					return [];
				} else {
					// test for window
					if (query==window) {
						return [query];
					}
					// test for jquery
					else if (query.jquery) {
						var elements = [];
						for (var j=0;j<query.length;j++) elements.push(query[j]);
						return elements;
					// test for self
					} else if (query.brahma) {
						var elements = [];
						for (var j=0;j<query.length;j++) elements.push(query[j]);
						return elements;				
					} else {
						
						return [query];
					};
				}
			break;
			case "undefined":
			default:
				return [query];
			break;
		};
	}
});