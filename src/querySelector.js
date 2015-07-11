define(function() {
	(function() {
            if (!HTMLElement.prototype.querySelectorAll) {
                throw new Error("rootedQuerySelectorAll: This polyfill can only be used with browsers that support querySelectorAll");
            }
            var container = document.createElement("div");
            try {
                container.querySelectorAll(":scope *");
            } catch (e) {

                var scopeRE = /^\s*:scope/gi;
                function overrideNodeMethod(prototype, methodName) {
                    var oldMethod = prototype[methodName];
                    prototype[methodName] = function(query) {
                        var nodeList, gaveId = false, gaveContainer = false;
                        if (query.match(scopeRE)) {

                            query = query.replace(scopeRE, "");
                            if (!this.parentNode) {
                                container.appendChild(this);
                                gaveContainer = true;
                            }
                            parentNode = this.parentNode;
                            if (!this.id) {
                                /*
                                Remove attribute change handler of custom element to prevent event 
                                spreading when it is id added by querySelector polyfill.
                                It will protect of a death loop in IE when handler uses querySelector,
                                and querySelector, by creating id, fires event attributeChanged and then
                                history repeats.
                                */
                                gaveId = this.attributeChangedCallback || true;
                                this.attributeChangedCallback = false;

                                this.id = "rootedQuerySelector_id_" + new Date().getTime();
                               
                            }
                            nodeList = oldMethod.call(parentNode, "#" + this.id + " " + query);
                            if (gaveId) {
                                this.id = "";
                                if ("function"===typeof gaveId) this.attributeChangedCallback = gaveId;
                                gaveId=null;
                            }
                            if (gaveContainer) {
                                container.removeChild(this);
                            }
                            return nodeList;
                        } else {
                            return oldMethod.call(this, query);
                        }
                    };
                }
                overrideNodeMethod(HTMLElement.prototype, "querySelector");
                overrideNodeMethod(HTMLElement.prototype, "querySelectorAll");
            }
        })();
        var regPseudoClasssDt = /:(eq|nth\-child)\(([0-9n\+ ]+)\)/ig,
        queryExpr = /<([a-zA-Z0-9_]+) \/>/i,
        argsExpr = /\[([a-zA-Z0-9_\-]*)[ ]?=([ ]?[^\]]*)\]/i,
        psopi = {
            eq: function(elements, attrs) {
                var index;
                if (!isNaN(index = parseInt(attrs[2]))) {
                    return [ index < 0 && index * -1 < elements.length ? elements[elements.length - index] : index < elements.length ? elements[index] : [] ];
                } else {
                    return [];
                }
            },
            "nth-child": function(elements, attrs) {
                var n = false, i = 0, rec = [], index;
                if (!isNaN(index = parseInt(attrs[2]))) {
                    n = attrs[2].indexOf("n") >= 0;
                    for (;i < elements.length; i++) {
                        if (!n && i === index) rec.push(elements[i]);
                        if (n && i % index === 0) rec.push(elements[i]);
                    }
                } else {
                    return [];
                }
                return rec;
            }
        },
        pseusoSelect = function(elements, selector) {
            var psop = regPseudoClasssDt.exec(selector);

            if ("function"!==typeof psopi[psop[1]]) {
                return [];
            } else {
                return psopi[psop[1]](elements, psop);
            }
        },
        queryFinder = function(query, root) {
            var prefix;
            root && root instanceof HTMLElement ? prefix = ":scope " : prefix = "";
            switch (typeof query) {
              case "string":
                var queryExpr = /<([a-zA-Z0-9_]+) \/>/i, argsExpr = /\[([a-zA-Z0-9_\-]*)[ ]?=([ ]?[^\]]*)\]/i;
                if (query.indexOf("[") > -1 && argsExpr.exec(query)) {
                    var patch = true;
                    query = query.replace(argsExpr, '[$1="$2"]');
                }
                if (queryExpr.exec(query) === null) {
                    if (query.length === 0) return new Array();
                    try {
                     return root.querySelectorAll(prefix + query);
                    } catch(e) {
                        /*
                        Тестируем псевдо-селекторы
                        */
                        regPseudoClasssDt.lastIndex = 0;
                        if (regPseudoClasssDt.test(query)==true) {
                            var ps = query.match(regPseudoClasssDt)[0];
                            /*
                            Перезапускаем запрос уже без псевдо-селектора
                            */
                            return pseusoSelect(queryFinder(query.replace(regPseudoClasssDt, ''), root), ps);
                        } else {
                            console.log(e);
                            throw 'querySelectorAll not support query: '+query;
                        }
                    }
                    
                } else {
                    return [ document.createElement(result[1].toUpperCase()) ];
                }
                ;
                break;

              case "function":
                return [];
                break;

              case "object":
                if (query instanceof Array) {
                    return query;
                }
                if (query === null) {
                    return [];
                } else {
                    if (query == window) {
                        return [ query ];
                    } else if (query.jquery) {
                        var elements = [];
                        for (var j = 0; j < query.length; j++) elements.push(query[j]);
                        return elements;
                    } else if (query.brahma) {
                        var elements = [];
                        for (var j = 0; j < query.length; j++) elements.push(query[j]);
                        return elements;
                    } else {
                        return [ query ];
                    }
                }
                break;

              case "undefined":
              default:
                return [ query ];
                break;
            }
        };
        return function(query, root) {
            var root = root || document, roots = [];
            if (root instanceof NodeList || root instanceof Array) {
                roots = Array.prototype.slice.apply(root);
            } else {
                roots = [ root ];
            }
            var stack = [];
            for (var i = 0; i < roots.length; ++i) {
                var response = queryFinder(query, roots[i]);

                if ( ("object" === typeof response || "function" === typeof response) && "number" === typeof response.length) {

                    for (var r = 0; r < response.length; ++r) {

                        stack.push(response[r]);
                    }
                }
            }

            return stack;
        };
});