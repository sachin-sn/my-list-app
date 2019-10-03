
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var index_umd = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
       module.exports = factory() ;
    }(commonjsGlobal, function () {
      var defaultExport = /*@__PURE__*/(function (Error) {
        function defaultExport(route, path) {
          var message = "Unreachable '" + route + "', segment '" + path + "' is not defined";
          Error.call(this, message);
          this.message = message;
        }

        if ( Error ) defaultExport.__proto__ = Error;
        defaultExport.prototype = Object.create( Error && Error.prototype );
        defaultExport.prototype.constructor = defaultExport;

        return defaultExport;
      }(Error));

      function buildMatcher(path, parent) {
        var regex;

        var _isSplat;

        var _priority = -100;

        var keys = [];
        regex = path.replace(/[-$.]/g, '\\$&').replace(/\(/g, '(?:').replace(/\)/g, ')?').replace(/([:*]\w+)(?:<([^<>]+?)>)?/g, function (_, key, expr) {
          keys.push(key.substr(1));

          if (key.charAt() === ':') {
            _priority += 100;
            return ("((?!#)" + (expr || '[^/]+?') + ")");
          }

          _isSplat = true;
          _priority += 500;
          return ("((?!#)" + (expr || '.+?') + ")");
        });

        try {
          regex = new RegExp(("^" + regex + "$"));
        } catch (e) {
          throw new TypeError(("Invalid route expression, given '" + parent + "'"));
        }

        var _hashed = path.includes('#') ? 0.5 : 1;

        var _depth = path.length * _priority * _hashed;

        return {
          keys: keys,
          regex: regex,
          _depth: _depth,
          _isSplat: _isSplat
        };
      }
      var PathMatcher = function PathMatcher(path, parent) {
        var ref = buildMatcher(path, parent);
        var keys = ref.keys;
        var regex = ref.regex;
        var _depth = ref._depth;
        var _isSplat = ref._isSplat;
        return {
          _isSplat: _isSplat,
          _depth: _depth,
          match: function (value) {
            var matches = value.match(regex);

            if (matches) {
              return keys.reduce(function (prev, cur, i) {
                prev[cur] = typeof matches[i + 1] === 'string' ? decodeURIComponent(matches[i + 1]) : null;
                return prev;
              }, {});
            }
          }
        };
      };

      PathMatcher.push = function push (key, prev, leaf, parent) {
        var root = prev[key] || (prev[key] = {});

        if (!root.pattern) {
          root.pattern = new PathMatcher(key, parent);
          root.route = leaf || '/';
        }

        prev.keys = prev.keys || [];

        if (!prev.keys.includes(key)) {
          prev.keys.push(key);
          PathMatcher.sort(prev);
        }

        return root;
      };

      PathMatcher.sort = function sort (root) {
        root.keys.sort(function (a, b) {
          return root[a].pattern._depth - root[b].pattern._depth;
        });
      };

      function merge(path, parent) {
        return ("" + (parent && parent !== '/' ? parent : '') + (path || ''));
      }
      function walk(path, cb) {
        var matches = path.match(/<[^<>]*\/[^<>]*>/);

        if (matches) {
          throw new TypeError(("RegExp cannot contain slashes, given '" + matches + "'"));
        }

        var parts = path !== '/' ? path.split('/') : [''];
        var root = [];
        parts.some(function (x, i) {
          var parent = root.concat(x).join('/') || null;
          var segment = parts.slice(i + 1).join('/') || null;
          var retval = cb(("/" + x), parent, segment ? ((x ? ("/" + x) : '') + "/" + segment) : null);
          root.push(x);
          return retval;
        });
      }
      function reduce(key, root, _seen) {
        var params = {};
        var out = [];
        var splat;
        walk(key, function (x, leaf, extra) {
          var found;

          if (!root.keys) {
            throw new defaultExport(key, x);
          }

          root.keys.some(function (k) {
            if (_seen.includes(k)) { return false; }
            var ref = root[k].pattern;
            var match = ref.match;
            var _isSplat = ref._isSplat;
            var matches = match(_isSplat ? extra || x : x);

            if (matches) {
              Object.assign(params, matches);

              if (root[k].route) {
                out.push(Object.assign({}, root[k].info, {
                  matches: x === leaf || _isSplat || !extra,
                  params: Object.assign({}, params),
                  route: root[k].route,
                  path: _isSplat ? extra : leaf || x
                }));
              }

              if (extra === null && !root[k].keys) {
                return true;
              }

              if (k !== '/') { _seen.push(k); }
              splat = _isSplat;
              root = root[k];
              found = true;
              return true;
            }

            return false;
          });

          if (!(found || root.keys.some(function (k) { return root[k].pattern.match(x); }))) {
            throw new defaultExport(key, x);
          }

          return splat || !found;
        });
        return out;
      }
      function find(path, routes, retries) {
        var get = reduce.bind(null, path, routes);
        var set = [];

        while (retries > 0) {
          retries -= 1;

          try {
            return get(set);
          } catch (e) {
            if (retries > 0) {
              return get(set);
            }

            throw e;
          }
        }
      }
      function add(path, routes, parent, routeInfo) {
        var fullpath = merge(path, parent);
        var root = routes;
        walk(fullpath, function (x, leaf) {
          root = PathMatcher.push(x, root, leaf, fullpath);

          if (x !== '/') {
            root.info = root.info || Object.assign({}, routeInfo);
          }
        });
        root.info = root.info || Object.assign({}, routeInfo);
        return fullpath;
      }
      function rm(path, routes, parent) {
        var fullpath = merge(path, parent);
        var root = routes;
        var leaf = null;
        var key = null;
        walk(fullpath, function (x) {
          if (!root) {
            leaf = null;
            return true;
          }

          key = x;
          leaf = x === '/' ? routes['/'] : root;

          if (!leaf.keys) {
            throw new defaultExport(path, x);
          }

          root = root[x];
        });

        if (!(leaf && key)) {
          throw new defaultExport(path, key);
        }

        delete leaf[key];

        if (key === '/') {
          delete leaf.info;
          delete leaf.route;
        }

        var offset = leaf.keys.indexOf(key);

        if (offset !== -1) {
          leaf.keys.splice(leaf.keys.indexOf(key), 1);
          PathMatcher.sort(leaf);
        }
      }

      var Router = function Router() {
        var routes = {};
        var stack = [];
        return {
          mount: function (path, cb) {
            if (path !== '/') {
              stack.push(path);
            }

            cb();
            stack.pop();
          },
          find: function (path, retries) { return find(path, routes, retries === true ? 2 : retries || 1); },
          add: function (path, routeInfo) { return add(path, routes, stack.join(''), routeInfo); },
          rm: function (path) { return rm(path, routes, stack.join('')); }
        };
      };

      return Router;

    }));
    });

    const CTX_ROUTER = {};

    function navigateTo(path) {
      // If path empty or no string, throws error
      if (!path || typeof path !== 'string') {
        throw Error(`svero expects navigateTo() to have a string parameter. The parameter provided was: ${path} of type ${typeof path} instead.`);
      }

      if (path[0] !== '/' && path[0] !== '#') {
        throw Error(`svero expects navigateTo() param to start with slash or hash, e.g. "/${path}" or "#${path}" instead of "${path}".`);
      }

      // If no History API support, fallbacks to URL redirect
      if (!history.pushState || !window.dispatchEvent) {
        window.location.href = path;
        return;
      }

      // If has History API support, uses it
      history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* node_modules/svero/src/Router.svelte generated by Svelte v3.9.1 */
    const { Object: Object_1 } = globals;

    const file = "node_modules/svero/src/Router.svelte";

    // (165:0) {#if failure && !nofallback}
    function create_if_block(ctx) {
    	var fieldset, legend, t0, t1, t2, pre, t3;

    	return {
    		c: function create() {
    			fieldset = element("fieldset");
    			legend = element("legend");
    			t0 = text("Router failure: ");
    			t1 = text(ctx.path);
    			t2 = space();
    			pre = element("pre");
    			t3 = text(ctx.failure);
    			add_location(legend, file, 166, 4, 3810);
    			add_location(pre, file, 167, 4, 3854);
    			add_location(fieldset, file, 165, 2, 3795);
    		},

    		m: function mount(target, anchor) {
    			insert(target, fieldset, anchor);
    			append(fieldset, legend);
    			append(legend, t0);
    			append(legend, t1);
    			append(fieldset, t2);
    			append(fieldset, pre);
    			append(pre, t3);
    		},

    		p: function update(changed, ctx) {
    			if (changed.path) {
    				set_data(t1, ctx.path);
    			}

    			if (changed.failure) {
    				set_data(t3, ctx.failure);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(fieldset);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var t_1, current, dispose;

    	var if_block = (ctx.failure && !ctx.nofallback) && create_if_block(ctx);

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			t_1 = space();

    			if (default_slot) default_slot.c();

    			dispose = listen(window, "popstate", ctx.handlePopState);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, t_1, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.failure && !ctx.nofallback) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(t_1.parentNode, t_1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(t_1);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    }



    const router = new index_umd();

    function cleanPath(route) {
      return route.replace(/\?[^#]*/, '').replace(/(?!^)\/#/, '#').replace('/#', '#').replace(/\/$/, '');
    }

    function fixPath(route) {
      if (route === '/#*' || route === '#*') return '#*_';
      if (route === '/*' || route === '*') return '/*_';
      return route;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $routeInfo, $basePath;

    	

      let t;
      let failure;
      let fallback;

      let { path = '/', nofallback = null } = $$props;

      const routeInfo = writable({}); validate_store(routeInfo, 'routeInfo'); component_subscribe($$self, routeInfo, $$value => { $routeInfo = $$value; $$invalidate('$routeInfo', $routeInfo); });
      const routerContext = getContext(CTX_ROUTER);
      const basePath = routerContext ? routerContext.basePath : writable(path); validate_store(basePath, 'basePath'); component_subscribe($$self, basePath, $$value => { $basePath = $$value; $$invalidate('$basePath', $basePath); });

      function handleRoutes(map) {
        const params = map.reduce((prev, cur) => {
          prev[cur.key] = Object.assign(prev[cur.key] || {}, cur.params);
          return prev;
        }, {});

        let skip;
        let routes = {};

        map.some(x => {
          if (typeof x.condition === 'boolean' || typeof x.condition === 'function') {
            const ok = typeof x.condition === 'function' ? x.condition() : x.condition;

            if (ok === false && x.redirect) {
              navigateTo(x.redirect);
              skip = true;
              return true;
            }
          }

          if (x.key && !routes[x.key]) {
            if (x.exact && !x.matches) return false;
            routes[x.key] = { ...x, params: params[x.key] };
          }

          return false;
        });

        if (!skip) {
          $routeInfo = routes; routeInfo.set($routeInfo);
        }
      }

      function doFallback(e, path) {
        $routeInfo[fallback] = { failure: e, params: { _: path.substr(1) || undefined } }; routeInfo.set($routeInfo);
      }

      function resolveRoutes(path) {
        const segments = path.split('#')[0].split('/');
        const prefix = [];
        const map = [];

        segments.forEach(key => {
          const sub = prefix.concat(`/${key}`).join('');

          if (key) prefix.push(`/${key}`);

          try {
            const next = router.find(sub);

            handleRoutes(next);
            map.push(...next);
          } catch (e_) {
            doFallback(e_, path);
          }
        });

        return map;
      }

      function handlePopState() {
        const fullpath = cleanPath(`/${location.href.split('/').slice(3).join('/')}`);

        try {
          const found = resolveRoutes(fullpath);

          if (fullpath.includes('#')) {
            const next = router.find(fullpath);
            const keys = {};

            // override previous routes to avoid non-exact matches
            handleRoutes(found.concat(next).reduce((prev, cur) => {
              if (typeof keys[cur.key] === 'undefined') {
                keys[cur.key] = prev.length;
              }

              prev[keys[cur.key]] = cur;

              return prev;
            }, []));
          }
        } catch (e) {
          if (!fallback) {
            $$invalidate('failure', failure = e);
            return;
          }

          doFallback(e, fullpath);
        }
      }

      function _handlePopState() {
        clearTimeout(t);
        t = setTimeout(handlePopState, 100);
      }

      function assignRoute(key, route, detail) {
        key = key || Math.random().toString(36).substr(2);

        const fixedRoot = $basePath !== path && $basePath !== '/'
          ? `${$basePath}${path}`
          : path;

        const handler = { key, ...detail };

        let fullpath;

        router.mount(fixedRoot, () => {
          fullpath = router.add(fixPath(route), handler);
          fallback = (handler.fallback && key) || fallback;
        });

        _handlePopState();

        return [key, fullpath];
      }

      function unassignRoute(route) {
        router.rm(fixPath(route));
        _handlePopState();
      }

      setContext(CTX_ROUTER, {
        basePath,
        routeInfo,
        assignRoute,
        unassignRoute,
      });

    	const writable_props = ['path', 'nofallback'];
    	Object_1.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('path' in $$props) $$invalidate('path', path = $$props.path);
    		if ('nofallback' in $$props) $$invalidate('nofallback', nofallback = $$props.nofallback);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		failure,
    		path,
    		nofallback,
    		routeInfo,
    		basePath,
    		handlePopState,
    		$$slots,
    		$$scope
    	};
    }

    class Router_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["path", "nofallback"]);
    	}

    	get path() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nofallback() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nofallback(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svero/src/Route.svelte generated by Svelte v3.9.1 */

    const get_default_slot_changes = ({ activeRouter, activeProps }) => ({ router: activeRouter, props: activeProps });
    const get_default_slot_context = ({ activeRouter, activeProps }) => ({
    	router: activeRouter,
    	props: activeProps
    });

    // (46:0) {#if activeRouter}
    function create_if_block$1(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block_1,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.component) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    // (49:2) {:else}
    function create_else_block(ctx) {
    	var current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, get_default_slot_context);

    	return {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(nodes);
    		},

    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && (changed.$$scope || changed.activeRouter || changed.activeProps)) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, get_default_slot_changes),
    					get_slot_context(default_slot_template, ctx, get_default_slot_context)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    // (47:2) {#if component}
    function create_if_block_1(ctx) {
    	var switch_instance_anchor, current;

    	var switch_instance_spread_levels = [
    		{ router: ctx.activeRouter },
    		ctx.activeProps
    	];

    	var switch_value = ctx.component;

    	function switch_props(ctx) {
    		let switch_instance_props = {};
    		for (var i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}
    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	return {
    		c: function create() {
    			if (switch_instance) switch_instance.$$.fragment.c();
    			switch_instance_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var switch_instance_changes = (changed.activeRouter || changed.activeProps) ? get_spread_update(switch_instance_spread_levels, [
    									(changed.activeRouter) && { router: ctx.activeRouter },
    			(changed.activeProps) && ctx.activeProps
    								]) : {};

    			if (switch_value !== (switch_value = ctx.component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;
    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});
    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());

    					switch_instance.$$.fragment.c();
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}

    			else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(switch_instance_anchor);
    			}

    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var if_block_anchor, current;

    	var if_block = (ctx.activeRouter) && create_if_block$1(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.activeRouter) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function getProps(given, required) {
      const { props, ...others } = given;

      // prune all declared props from this component
      required.forEach(k => {
        delete others[k];
      });

      return {
        ...props,
        ...others,
      };
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $routeInfo;

    	

      let { key = null, path = '', props = null, exact = undefined, fallback = undefined, component = undefined, condition = undefined, redirect = undefined } = $$props;

      const { assignRoute, unassignRoute, routeInfo } = getContext(CTX_ROUTER); validate_store(routeInfo, 'routeInfo'); component_subscribe($$self, routeInfo, $$value => { $routeInfo = $$value; $$invalidate('$routeInfo', $routeInfo); });

      let activeRouter = null;
      let activeProps = {};
      let fullpath;

      [key, fullpath] = assignRoute(key, path, { condition, redirect, fallback, exact }); $$invalidate('key', key);
      onDestroy(() => {
        unassignRoute(fullpath);
      });

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('key' in $$new_props) $$invalidate('key', key = $$new_props.key);
    		if ('path' in $$new_props) $$invalidate('path', path = $$new_props.path);
    		if ('props' in $$new_props) $$invalidate('props', props = $$new_props.props);
    		if ('exact' in $$new_props) $$invalidate('exact', exact = $$new_props.exact);
    		if ('fallback' in $$new_props) $$invalidate('fallback', fallback = $$new_props.fallback);
    		if ('component' in $$new_props) $$invalidate('component', component = $$new_props.component);
    		if ('condition' in $$new_props) $$invalidate('condition', condition = $$new_props.condition);
    		if ('redirect' in $$new_props) $$invalidate('redirect', redirect = $$new_props.redirect);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	$$self.$$.update = ($$dirty = { $routeInfo: 1, key: 1, $$props: 1 }) => {
    		{
            $$invalidate('activeRouter', activeRouter = $routeInfo[key]);
            $$invalidate('activeProps', activeProps = getProps($$props, arguments[0]['$$'].props));
          }
    	};

    	return {
    		key,
    		path,
    		props,
    		exact,
    		fallback,
    		component,
    		condition,
    		redirect,
    		routeInfo,
    		activeRouter,
    		activeProps,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["key", "path", "props", "exact", "fallback", "component", "condition", "redirect"]);
    	}

    	get key() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get props() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set props(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get exact() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set exact(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fallback() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fallback(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get condition() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set condition(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get redirect() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set redirect(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svero/src/Link.svelte generated by Svelte v3.9.1 */

    const file$1 = "node_modules/svero/src/Link.svelte";

    function create_fragment$2(ctx) {
    	var a, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	return {
    		c: function create() {
    			a = element("a");

    			if (default_slot) default_slot.c();

    			attr(a, "href", ctx.href);
    			attr(a, "class", ctx.className);
    			add_location(a, file$1, 31, 0, 684);
    			dispose = listen(a, "click", prevent_default(ctx.onClick));
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(a_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if (!current || changed.href) {
    				attr(a, "href", ctx.href);
    			}

    			if (!current || changed.className) {
    				attr(a, "class", ctx.className);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

      let { class: cssClass = '', href = '/', className = '', title = '' } = $$props;

      onMount(() => {
        $$invalidate('className', className = className || cssClass);
      });

      const dispatch = createEventDispatcher();

      // this will enable `<Link on:click={...} />` calls
      function onClick(e) {
        let fixedHref = href;

        // this will rebase anchors to avoid location changes
        if (fixedHref.charAt() !== '/') {
          fixedHref = window.location.pathname + fixedHref;
        }

        navigateTo(fixedHref);
        dispatch('click', e);
      }

    	const writable_props = ['class', 'href', 'className', 'title'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Link> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('class' in $$props) $$invalidate('cssClass', cssClass = $$props.class);
    		if ('href' in $$props) $$invalidate('href', href = $$props.href);
    		if ('className' in $$props) $$invalidate('className', className = $$props.className);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		cssClass,
    		href,
    		className,
    		title,
    		onClick,
    		$$slots,
    		$$scope
    	};
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["class", "href", "className", "title"]);
    	}

    	get class() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get className() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set className(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const httpGet =() => {
    	return fetch('https://zb4n1zisp5.execute-api.us-east-1.amazonaws.com/dev/getalldata/',{
    		method: 'GET',
    		headers: {
          	'Content-Type': 'application/json'
    		}
    	})
    	.then((response)=>{
    		if(response.status ==200) {
    			return response.json()	;
    		}
    	})
    };
    const httpPost = (payload) => {
    	return fetch('https://zb4n1zisp5.execute-api.us-east-1.amazonaws.com/dev/savedata',{
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          	'Content-Type': 'application/json'
        }
      })
    	.then((response)=>{
    		if(response.status ==200) {
    			return response.json();
    		}
    		return response.reject();
    	})
    };

    /* src/container/List.svelte generated by Svelte v3.9.1 */

    const file$2 = "src/container/List.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	child_ctx.index = i;
    	return child_ctx;
    }

    // (109:6) {#each list as item, index}
    function create_each_block(ctx) {
    	var tr, td0, t0_value = ctx.index + 1 + "", t0, t1, td1, t2_value = ctx.item.name + "", t2, t3, td2, t4_value = ctx.item.quantity + "", t4, t5, td3, t6_value = ctx.item.amount + "", t6, t7, td4, t8_value = parseFloat(ctx.item.amount * ctx.item.quantity).toFixed(2) + "", t8, t9, td5, button, t11, dispose;

    	function click_handler(...args) {
    		return ctx.click_handler(ctx, ...args);
    	}

    	return {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			button = element("button");
    			button.textContent = "Delete";
    			t11 = space();
    			add_location(td0, file$2, 110, 10, 2556);
    			add_location(td1, file$2, 111, 10, 2587);
    			add_location(td2, file$2, 112, 10, 2618);
    			add_location(td3, file$2, 113, 10, 2653);
    			add_location(td4, file$2, 114, 10, 2686);
    			attr(button, "class", "failure sm");
    			add_location(button, file$2, 116, 12, 2775);
    			add_location(td5, file$2, 115, 10, 2758);
    			add_location(tr, file$2, 109, 8, 2541);
    			dispose = listen(button, "click", click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, tr, anchor);
    			append(tr, td0);
    			append(td0, t0);
    			append(tr, t1);
    			append(tr, td1);
    			append(td1, t2);
    			append(tr, t3);
    			append(tr, td2);
    			append(td2, t4);
    			append(tr, t5);
    			append(tr, td3);
    			append(td3, t6);
    			append(tr, t7);
    			append(tr, td4);
    			append(td4, t8);
    			append(tr, t9);
    			append(tr, td5);
    			append(td5, button);
    			append(tr, t11);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.list) && t2_value !== (t2_value = ctx.item.name + "")) {
    				set_data(t2, t2_value);
    			}

    			if ((changed.list) && t4_value !== (t4_value = ctx.item.quantity + "")) {
    				set_data(t4, t4_value);
    			}

    			if ((changed.list) && t6_value !== (t6_value = ctx.item.amount + "")) {
    				set_data(t6, t6_value);
    			}

    			if ((changed.list) && t8_value !== (t8_value = parseFloat(ctx.item.amount * ctx.item.quantity).toFixed(2) + "")) {
    				set_data(t8, t8_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(tr);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	var main, section3, section0, label0, t1, input0, t2, section1, label1, t4, input1, t5, section2, label2, t7, input2, t8, button0, t10, button1, t12, section4, p, label3, t14, span0, t15, t16, br, t17, label4, t19, span1, t20_value = ctx.list.length + "", t20, t21, section5, table, tr, th0, t23, th1, t25, th2, t27, th3, t29, th4, t31, th5, t33, dispose;

    	var each_value = ctx.list;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			main = element("main");
    			section3 = element("section");
    			section0 = element("section");
    			label0 = element("label");
    			label0.textContent = "Name:";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			section1 = element("section");
    			label1 = element("label");
    			label1.textContent = "Quantity:";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			section2 = element("section");
    			label2 = element("label");
    			label2.textContent = "M.R.P per piece:";
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			button0 = element("button");
    			button0.textContent = "Add";
    			t10 = space();
    			button1 = element("button");
    			button1.textContent = "Reset";
    			t12 = space();
    			section4 = element("section");
    			p = element("p");
    			label3 = element("label");
    			label3.textContent = "Total cost:";
    			t14 = space();
    			span0 = element("span");
    			t15 = text(ctx.total);
    			t16 = space();
    			br = element("br");
    			t17 = space();
    			label4 = element("label");
    			label4.textContent = "Total no of Items:";
    			t19 = space();
    			span1 = element("span");
    			t20 = text(t20_value);
    			t21 = space();
    			section5 = element("section");
    			table = element("table");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "#";
    			t23 = space();
    			th1 = element("th");
    			th1.textContent = "Name";
    			t25 = space();
    			th2 = element("th");
    			th2.textContent = "Qty";
    			t27 = space();
    			th3 = element("th");
    			th3.textContent = "M.R.P";
    			t29 = space();
    			th4 = element("th");
    			th4.textContent = "Total";
    			t31 = space();
    			th5 = element("th");
    			th5.textContent = "Action";
    			t33 = space();

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			add_location(label0, file$2, 75, 6, 1554);
    			attr(input0, "type", "text");
    			attr(input0, "class", "input-text");
    			add_location(input0, file$2, 76, 6, 1581);
    			attr(section0, "class", "input-block");
    			add_location(section0, file$2, 74, 4, 1518);
    			add_location(label1, file$2, 79, 6, 1695);
    			attr(input1, "type", "number");
    			attr(input1, "class", "input-text");
    			add_location(input1, file$2, 80, 6, 1726);
    			attr(section1, "class", "input-block");
    			add_location(section1, file$2, 78, 4, 1659);
    			add_location(label2, file$2, 83, 6, 1846);
    			attr(input2, "type", "number");
    			attr(input2, "class", "input-text");
    			add_location(input2, file$2, 84, 6, 1884);
    			attr(section2, "class", "input-block");
    			add_location(section2, file$2, 82, 4, 1810);
    			attr(button0, "class", "success");
    			add_location(button0, file$2, 86, 4, 1966);
    			attr(button1, "class", "failure rt");
    			add_location(button1, file$2, 87, 4, 2026);
    			attr(section3, "class", "input-form");
    			add_location(section3, file$2, 73, 2, 1485);
    			add_location(label3, file$2, 91, 6, 2141);
    			add_location(span0, file$2, 92, 6, 2174);
    			add_location(br, file$2, 93, 6, 2201);
    			add_location(label4, file$2, 94, 6, 2214);
    			add_location(span1, file$2, 95, 6, 2254);
    			add_location(p, file$2, 90, 4, 2131);
    			attr(section4, "class", "listItem");
    			add_location(section4, file$2, 89, 2, 2100);
    			add_location(th0, file$2, 101, 8, 2363);
    			add_location(th1, file$2, 102, 8, 2382);
    			add_location(th2, file$2, 103, 8, 2404);
    			add_location(th3, file$2, 104, 8, 2425);
    			add_location(th4, file$2, 105, 8, 2448);
    			add_location(th5, file$2, 106, 8, 2471);
    			add_location(tr, file$2, 100, 6, 2350);
    			add_location(table, file$2, 99, 4, 2336);
    			attr(section5, "class", "listItem");
    			add_location(section5, file$2, 98, 2, 2305);
    			add_location(main, file$2, 72, 0, 1476);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(input2, "input", ctx.input2_input_handler),
    				listen(button0, "click", ctx.AddItem),
    				listen(button1, "click", ctx.reset)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			append(main, section3);
    			append(section3, section0);
    			append(section0, label0);
    			append(section0, t1);
    			append(section0, input0);

    			set_input_value(input0, ctx.name);

    			append(section3, t2);
    			append(section3, section1);
    			append(section1, label1);
    			append(section1, t4);
    			append(section1, input1);

    			set_input_value(input1, ctx.quantity);

    			append(section3, t5);
    			append(section3, section2);
    			append(section2, label2);
    			append(section2, t7);
    			append(section2, input2);

    			set_input_value(input2, ctx.amount);

    			append(section3, t8);
    			append(section3, button0);
    			append(section3, t10);
    			append(section3, button1);
    			append(main, t12);
    			append(main, section4);
    			append(section4, p);
    			append(p, label3);
    			append(p, t14);
    			append(p, span0);
    			append(span0, t15);
    			append(p, t16);
    			append(p, br);
    			append(p, t17);
    			append(p, label4);
    			append(p, t19);
    			append(p, span1);
    			append(span1, t20);
    			append(main, t21);
    			append(main, section5);
    			append(section5, table);
    			append(table, tr);
    			append(tr, th0);
    			append(tr, t23);
    			append(tr, th1);
    			append(tr, t25);
    			append(tr, th2);
    			append(tr, t27);
    			append(tr, th3);
    			append(tr, t29);
    			append(tr, th4);
    			append(tr, t31);
    			append(tr, th5);
    			append(table, t33);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.name && (input0.value !== ctx.name)) set_input_value(input0, ctx.name);
    			if (changed.quantity) set_input_value(input1, ctx.quantity);
    			if (changed.amount) set_input_value(input2, ctx.amount);

    			if (changed.total) {
    				set_data(t15, ctx.total);
    			}

    			if ((changed.list) && t20_value !== (t20_value = ctx.list.length + "")) {
    				set_data(t20, t20_value);
    			}

    			if (changed.list) {
    				each_value = ctx.list;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	

      let list = [];
      let total = 0;

      let name, amount, quantity;

      function saveData() {
        httpPost([...list]).then(data => {
          console.log(data);
        });
      }

      onMount(()=>{
    		httpGet().then(data => {
          if (data) {
            data = JSON.parse(data);
            $$invalidate('list', list = [...data]);
            $$invalidate('total', total = 0);
            list.forEach(item => {
              $$invalidate('total', total = total + item.quantity * item.amount);
            });
          }
        });
    	});

      setInterval(() => {
        httpGet().then(data => {
          if (data) {
            data = JSON.parse(data);
            $$invalidate('list', list = [...data]);
            $$invalidate('total', total = 0);
            list.forEach(item => {
              $$invalidate('total', total = total + item.quantity * item.amount);
            });
          }
        });
      }, 3000);

      function AddItem() {
        if (name && amount && quantity) {
          let newItem = {
            name: name,
            amount: amount,
            quantity: quantity
          };
          $$invalidate('list', list = [...list, newItem]);
    			$$invalidate('total', total = total + quantity * amount);
          $$invalidate('name', name = "");
          $$invalidate('amount', amount = "");
          $$invalidate('quantity', quantity = "");
          saveData();
        }
      }
      function reset() {
        $$invalidate('name', name = "");
        $$invalidate('amount', amount = "");
        $$invalidate('quantity', quantity = "");
      }

      function deleteItem(itemIndex) {
        let delItem = list.filter((item, index) => index === itemIndex)[0];
        $$invalidate('total', total = total - delItem.amount * delItem.quantity);
        $$invalidate('list', list = list.filter((item, index) => index !== itemIndex));
        $$invalidate('list', list = [...list]);
        saveData();
      }

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate('name', name);
    	}

    	function input1_input_handler() {
    		quantity = to_number(this.value);
    		$$invalidate('quantity', quantity);
    	}

    	function input2_input_handler() {
    		amount = to_number(this.value);
    		$$invalidate('amount', amount);
    	}

    	function click_handler({ index }, e) {
    	                deleteItem(index);
    	              }

    	return {
    		list,
    		total,
    		name,
    		amount,
    		quantity,
    		AddItem,
    		reset,
    		deleteItem,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		click_handler
    	};
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, []);
    	}
    }

    /* src/container/Join.svelte generated by Svelte v3.9.1 */

    const file$3 = "src/container/Join.svelte";

    function create_fragment$4(ctx) {
    	var section2, h3, t1, section0, label0, t3, input0, t4, section1, label1, t6, input1, t7, button0, t9, button1, dispose;

    	return {
    		c: function create() {
    			section2 = element("section");
    			h3 = element("h3");
    			h3.textContent = "Join a session";
    			t1 = space();
    			section0 = element("section");
    			label0 = element("label");
    			label0.textContent = "Session Id:";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			section1 = element("section");
    			label1 = element("label");
    			label1.textContent = "Name:";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			button0 = element("button");
    			button0.textContent = "Join";
    			t9 = space();
    			button1 = element("button");
    			button1.textContent = "Reset";
    			add_location(h3, file$3, 7, 2, 103);
    			add_location(label0, file$3, 9, 4, 163);
    			attr(input0, "type", "text");
    			attr(input0, "class", "input-text");
    			add_location(input0, file$3, 10, 4, 194);
    			attr(section0, "class", "input-block");
    			add_location(section0, file$3, 8, 2, 129);
    			add_location(label1, file$3, 13, 4, 307);
    			attr(input1, "type", "text");
    			attr(input1, "class", "input-text");
    			add_location(input1, file$3, 14, 4, 332);
    			attr(section1, "class", "input-block");
    			add_location(section1, file$3, 12, 2, 273);
    			attr(button0, "class", "success");
    			add_location(button0, file$3, 16, 2, 406);
    			attr(button1, "class", "default");
    			add_location(button1, file$3, 23, 2, 508);
    			attr(section2, "class", "input-form");
    			add_location(section2, file$3, 6, 0, 72);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(button0, "click", ctx.click_handler),
    				listen(button1, "click", ctx.click_handler_1)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, section2, anchor);
    			append(section2, h3);
    			append(section2, t1);
    			append(section2, section0);
    			append(section0, label0);
    			append(section0, t3);
    			append(section0, input0);

    			set_input_value(input0, ctx.sessionId);

    			append(section2, t4);
    			append(section2, section1);
    			append(section1, label1);
    			append(section1, t6);
    			append(section1, input1);

    			set_input_value(input1, ctx.Name);

    			append(section2, t7);
    			append(section2, button0);
    			append(section2, t9);
    			append(section2, button1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.sessionId && (input0.value !== ctx.sessionId)) set_input_value(input0, ctx.sessionId);
    			if (changed.Name && (input1.value !== ctx.Name)) set_input_value(input1, ctx.Name);
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(section2);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let sessionId, Name;

    	function input0_input_handler() {
    		sessionId = this.value;
    		$$invalidate('sessionId', sessionId);
    	}

    	function input1_input_handler() {
    		Name = this.value;
    		$$invalidate('Name', Name);
    	}

    	function click_handler() {
    	    }

    	function click_handler_1() {
    	      sessionId = ''; $$invalidate('sessionId', sessionId);
    	      Name = ''; $$invalidate('Name', Name);
    	    }

    	return {
    		sessionId,
    		Name,
    		input0_input_handler,
    		input1_input_handler,
    		click_handler,
    		click_handler_1
    	};
    }

    class Join extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, []);
    	}
    }

    /* src/container/Login.svelte generated by Svelte v3.9.1 */

    const file$4 = "src/container/Login.svelte";

    function create_fragment$5(ctx) {
    	var main, t0, section2, section0, label0, t2, input0, t3, section1, label1, t5, input1, t6, button0, t8, button1, t10, a, current, dispose;

    	var join = new Join({ $$inline: true });

    	return {
    		c: function create() {
    			main = element("main");
    			join.$$.fragment.c();
    			t0 = space();
    			section2 = element("section");
    			section0 = element("section");
    			label0 = element("label");
    			label0.textContent = "Email:";
    			t2 = space();
    			input0 = element("input");
    			t3 = space();
    			section1 = element("section");
    			label1 = element("label");
    			label1.textContent = "Password";
    			t5 = space();
    			input1 = element("input");
    			t6 = space();
    			button0 = element("button");
    			button0.textContent = "Login";
    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "Forgot password";
    			t10 = space();
    			a = element("a");
    			a.textContent = "Register";
    			add_location(label0, file$4, 13, 2, 183);
    			attr(input0, "type", "email");
    			attr(input0, "class", "input-text");
    			add_location(input0, file$4, 14, 2, 207);
    			attr(section0, "class", "input-block");
    			add_location(section0, file$4, 12, 4, 151);
    			add_location(label1, file$4, 17, 2, 315);
    			attr(input1, "type", "password");
    			attr(input1, "class", "input-text");
    			add_location(input1, file$4, 18, 2, 341);
    			attr(section1, "class", "input-block");
    			add_location(section1, file$4, 16, 4, 283);
    			attr(button0, "class", "success");
    			add_location(button0, file$4, 20, 1, 420);
    			attr(button1, "class", "default");
    			add_location(button1, file$4, 21, 1, 460);
    			attr(a, "href", "./");
    			add_location(a, file$4, 22, 1, 510);
    			attr(section2, "class", "input-form");
    			add_location(section2, file$4, 11, 0, 118);
    			add_location(main, file$4, 9, 0, 102);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			mount_component(join, main, null);
    			append(main, t0);
    			append(main, section2);
    			append(section2, section0);
    			append(section0, label0);
    			append(section0, t2);
    			append(section0, input0);

    			set_input_value(input0, ctx.email);

    			append(section2, t3);
    			append(section2, section1);
    			append(section1, label1);
    			append(section1, t5);
    			append(section1, input1);

    			set_input_value(input1, ctx.password);

    			append(section2, t6);
    			append(section2, button0);
    			append(section2, t8);
    			append(section2, button1);
    			append(section2, t10);
    			append(section2, a);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.email && (input0.value !== ctx.email)) set_input_value(input0, ctx.email);
    			if (changed.password && (input1.value !== ctx.password)) set_input_value(input1, ctx.password);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(join.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(join.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			destroy_component(join);

    			run_all(dispose);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let email, password;

    	function input0_input_handler() {
    		email = this.value;
    		$$invalidate('email', email);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate('password', password);
    	}

    	return {
    		email,
    		password,
    		input0_input_handler,
    		input1_input_handler
    	};
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, []);
    	}
    }

    /* src/container/Register.svelte generated by Svelte v3.9.1 */

    const file$5 = "src/container/Register.svelte";

    function create_fragment$6(ctx) {
    	var main, section3, section0, label0, t1, input0, t2, section1, label1, t4, input1, t5, section2, label2, t7, input2, t8, button, dispose;

    	return {
    		c: function create() {
    			main = element("main");
    			section3 = element("section");
    			section0 = element("section");
    			label0 = element("label");
    			label0.textContent = "Email:";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			section1 = element("section");
    			label1 = element("label");
    			label1.textContent = "Password";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			section2 = element("section");
    			label2 = element("label");
    			label2.textContent = "Retype Password";
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			button = element("button");
    			button.textContent = "Register";
    			add_location(label0, file$5, 7, 2, 112);
    			attr(input0, "type", "email");
    			attr(input0, "class", "input-text");
    			add_location(input0, file$5, 8, 2, 136);
    			attr(section0, "class", "input-block");
    			add_location(section0, file$5, 6, 4, 80);
    			add_location(label1, file$5, 11, 2, 244);
    			attr(input1, "type", "password");
    			attr(input1, "class", "input-text");
    			add_location(input1, file$5, 12, 2, 270);
    			attr(section1, "class", "input-block");
    			add_location(section1, file$5, 10, 4, 212);
    			add_location(label2, file$5, 15, 2, 384);
    			attr(input2, "type", "password");
    			attr(input2, "class", "input-text");
    			add_location(input2, file$5, 16, 2, 417);
    			attr(section2, "class", "input-block");
    			add_location(section2, file$5, 14, 4, 352);
    			attr(button, "class", "default");
    			add_location(button, file$5, 18, 1, 496);
    			attr(section3, "class", "input-form");
    			add_location(section3, file$5, 5, 0, 47);
    			add_location(main, file$5, 4, 0, 40);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(input2, "input", ctx.input2_input_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			append(main, section3);
    			append(section3, section0);
    			append(section0, label0);
    			append(section0, t1);
    			append(section0, input0);

    			set_input_value(input0, ctx.email);

    			append(section3, t2);
    			append(section3, section1);
    			append(section1, label1);
    			append(section1, t4);
    			append(section1, input1);

    			set_input_value(input1, ctx.password);

    			append(section3, t5);
    			append(section3, section2);
    			append(section2, label2);
    			append(section2, t7);
    			append(section2, input2);

    			set_input_value(input2, ctx.password);

    			append(section3, t8);
    			append(section3, button);
    		},

    		p: function update(changed, ctx) {
    			if (changed.email && (input0.value !== ctx.email)) set_input_value(input0, ctx.email);
    			if (changed.password && (input1.value !== ctx.password)) set_input_value(input1, ctx.password);
    			if (changed.password && (input2.value !== ctx.password)) set_input_value(input2, ctx.password);
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let email, password;

    	function input0_input_handler() {
    		email = this.value;
    		$$invalidate('email', email);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate('password', password);
    	}

    	function input2_input_handler() {
    		password = this.value;
    		$$invalidate('password', password);
    	}

    	return {
    		email,
    		password,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	};
    }

    class Register extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, []);
    	}
    }

    // Found this seed-based random generator somewhere
    // Based on The Central Randomizer 1.3 (C) 1997 by Paul Houle (houle@msc.cornell.edu)

    var seed = 1;

    /**
     * return a random number based on a seed
     * @param seed
     * @returns {number}
     */
    function getNextValue() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed/(233280.0);
    }

    function setSeed(_seed_) {
        seed = _seed_;
    }

    var randomFromSeed = {
        nextValue: getNextValue,
        seed: setSeed
    };

    var ORIGINAL = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
    var alphabet;
    var previousSeed;

    var shuffled;

    function reset() {
        shuffled = false;
    }

    function setCharacters(_alphabet_) {
        if (!_alphabet_) {
            if (alphabet !== ORIGINAL) {
                alphabet = ORIGINAL;
                reset();
            }
            return;
        }

        if (_alphabet_ === alphabet) {
            return;
        }

        if (_alphabet_.length !== ORIGINAL.length) {
            throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. You submitted ' + _alphabet_.length + ' characters: ' + _alphabet_);
        }

        var unique = _alphabet_.split('').filter(function(item, ind, arr){
           return ind !== arr.lastIndexOf(item);
        });

        if (unique.length) {
            throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. These characters were not unique: ' + unique.join(', '));
        }

        alphabet = _alphabet_;
        reset();
    }

    function characters(_alphabet_) {
        setCharacters(_alphabet_);
        return alphabet;
    }

    function setSeed$1(seed) {
        randomFromSeed.seed(seed);
        if (previousSeed !== seed) {
            reset();
            previousSeed = seed;
        }
    }

    function shuffle() {
        if (!alphabet) {
            setCharacters(ORIGINAL);
        }

        var sourceArray = alphabet.split('');
        var targetArray = [];
        var r = randomFromSeed.nextValue();
        var characterIndex;

        while (sourceArray.length > 0) {
            r = randomFromSeed.nextValue();
            characterIndex = Math.floor(r * sourceArray.length);
            targetArray.push(sourceArray.splice(characterIndex, 1)[0]);
        }
        return targetArray.join('');
    }

    function getShuffled() {
        if (shuffled) {
            return shuffled;
        }
        shuffled = shuffle();
        return shuffled;
    }

    /**
     * lookup shuffled letter
     * @param index
     * @returns {string}
     */
    function lookup(index) {
        var alphabetShuffled = getShuffled();
        return alphabetShuffled[index];
    }

    function get () {
      return alphabet || ORIGINAL;
    }

    var alphabet_1 = {
        get: get,
        characters: characters,
        seed: setSeed$1,
        lookup: lookup,
        shuffled: getShuffled
    };

    var crypto = typeof window === 'object' && (window.crypto || window.msCrypto); // IE 11 uses window.msCrypto

    var randomByte;

    if (!crypto || !crypto.getRandomValues) {
        randomByte = function(size) {
            var bytes = [];
            for (var i = 0; i < size; i++) {
                bytes.push(Math.floor(Math.random() * 256));
            }
            return bytes;
        };
    } else {
        randomByte = function(size) {
            return crypto.getRandomValues(new Uint8Array(size));
        };
    }

    var randomByteBrowser = randomByte;

    /**
     * Secure random string generator with custom alphabet.
     *
     * Alphabet must contain 256 symbols or less. Otherwise, the generator
     * will not be secure.
     *
     * @param {generator} random The random bytes generator.
     * @param {string} alphabet Symbols to be used in new random string.
     * @param {size} size The number of symbols in new random string.
     *
     * @return {string} Random string.
     *
     * @example
     * const format = require('nanoid/format')
     *
     * function random (size) {
     *   const result = []
     *   for (let i = 0; i < size; i++) {
     *     result.push(randomByte())
     *   }
     *   return result
     * }
     *
     * format(random, "abcdef", 5) //=> "fbaef"
     *
     * @name format
     * @function
     */
    var format = function (random, alphabet, size) {
      var mask = (2 << Math.log(alphabet.length - 1) / Math.LN2) - 1;
      var step = Math.ceil(1.6 * mask * size / alphabet.length);
      size = +size;

      var id = '';
      while (true) {
        var bytes = random(step);
        for (var i = 0; i < step; i++) {
          var byte = bytes[i] & mask;
          if (alphabet[byte]) {
            id += alphabet[byte];
            if (id.length === size) return id
          }
        }
      }
    };

    function generate(number) {
        var loopCounter = 0;
        var done;

        var str = '';

        while (!done) {
            str = str + format(randomByteBrowser, alphabet_1.get(), 1);
            done = number < (Math.pow(16, loopCounter + 1 ) );
            loopCounter++;
        }
        return str;
    }

    var generate_1 = generate;

    // Ignore all milliseconds before a certain time to reduce the size of the date entropy without sacrificing uniqueness.
    // This number should be updated every year or so to keep the generated id short.
    // To regenerate `new Date() - 0` and bump the version. Always bump the version!
    var REDUCE_TIME = 1567752802062;

    // don't change unless we change the algos or REDUCE_TIME
    // must be an integer and less than 16
    var version = 7;

    // Counter is used when shortid is called multiple times in one second.
    var counter;

    // Remember the last time shortid was called in case counter is needed.
    var previousSeconds;

    /**
     * Generate unique id
     * Returns string id
     */
    function build(clusterWorkerId) {
        var str = '';

        var seconds = Math.floor((Date.now() - REDUCE_TIME) * 0.001);

        if (seconds === previousSeconds) {
            counter++;
        } else {
            counter = 0;
            previousSeconds = seconds;
        }

        str = str + generate_1(version);
        str = str + generate_1(clusterWorkerId);
        if (counter > 0) {
            str = str + generate_1(counter);
        }
        str = str + generate_1(seconds);
        return str;
    }

    var build_1 = build;

    function isShortId(id) {
        if (!id || typeof id !== 'string' || id.length < 6 ) {
            return false;
        }

        var nonAlphabetic = new RegExp('[^' +
          alphabet_1.get().replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&') +
        ']');
        return !nonAlphabetic.test(id);
    }

    var isValid = isShortId;

    var lib = createCommonjsModule(function (module) {





    // if you are using cluster or multiple servers use this to make each instance
    // has a unique value for worker
    // Note: I don't know if this is automatically set when using third
    // party cluster solutions such as pm2.
    var clusterWorkerId =  0;

    /**
     * Set the seed.
     * Highly recommended if you don't want people to try to figure out your id schema.
     * exposed as shortid.seed(int)
     * @param seed Integer value to seed the random alphabet.  ALWAYS USE THE SAME SEED or you might get overlaps.
     */
    function seed(seedValue) {
        alphabet_1.seed(seedValue);
        return module.exports;
    }

    /**
     * Set the cluster worker or machine id
     * exposed as shortid.worker(int)
     * @param workerId worker must be positive integer.  Number less than 16 is recommended.
     * returns shortid module so it can be chained.
     */
    function worker(workerId) {
        clusterWorkerId = workerId;
        return module.exports;
    }

    /**
     *
     * sets new characters to use in the alphabet
     * returns the shuffled alphabet
     */
    function characters(newCharacters) {
        if (newCharacters !== undefined) {
            alphabet_1.characters(newCharacters);
        }

        return alphabet_1.shuffled();
    }

    /**
     * Generate unique id
     * Returns string id
     */
    function generate() {
      return build_1(clusterWorkerId);
    }

    // Export all other functions as properties of the generate function
    module.exports = generate;
    module.exports.generate = generate;
    module.exports.seed = seed;
    module.exports.worker = worker;
    module.exports.characters = characters;
    module.exports.isValid = isValid;
    });
    var lib_1 = lib.generate;
    var lib_2 = lib.seed;
    var lib_3 = lib.worker;
    var lib_4 = lib.characters;
    var lib_5 = lib.isValid;

    var shortid = lib;

    /* src/container/Create.svelte generated by Svelte v3.9.1 */

    const file$6 = "src/container/Create.svelte";

    function create_fragment$7(ctx) {
    	var section1, h3, t1, section0, label, t3, input, t4, button, dispose;

    	return {
    		c: function create() {
    			section1 = element("section");
    			h3 = element("h3");
    			h3.textContent = "Create a session";
    			t1 = space();
    			section0 = element("section");
    			label = element("label");
    			label.textContent = "Name:";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			button = element("button");
    			button.textContent = "Create";
    			add_location(h3, file$6, 14, 2, 193);
    			add_location(label, file$6, 16, 4, 255);
    			attr(input, "type", "text");
    			attr(input, "class", "input-text");
    			add_location(input, file$6, 17, 4, 280);
    			attr(section0, "class", "input-block");
    			add_location(section0, file$6, 15, 2, 221);
    			attr(button, "class", "success");
    			add_location(button, file$6, 19, 2, 361);
    			attr(section1, "class", "input-form");
    			add_location(section1, file$6, 13, 0, 162);

    			dispose = [
    				listen(input, "input", ctx.input_input_handler),
    				listen(button, "click", ctx.click_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, section1, anchor);
    			append(section1, h3);
    			append(section1, t1);
    			append(section1, section0);
    			append(section0, label);
    			append(section0, t3);
    			append(section0, input);

    			set_input_value(input, ctx.sessionName);

    			append(section1, t4);
    			append(section1, button);
    		},

    		p: function update(changed, ctx) {
    			if (changed.sessionName && (input.value !== ctx.sessionName)) set_input_value(input, ctx.sessionName);
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(section1);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function createSession() {
      console.log(shortid.generate());
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let sessionName;

    	function input_input_handler() {
    		sessionName = this.value;
    		$$invalidate('sessionName', sessionName);
    	}

    	function click_handler() {
    	      createSession();
    	    }

    	return {
    		sessionName,
    		input_input_handler,
    		click_handler
    	};
    }

    class Create extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, []);
    	}
    }

    /* src/container/Home.svelte generated by Svelte v3.9.1 */

    const file$7 = "src/container/Home.svelte";

    function create_fragment$8(ctx) {
    	var main, t, current;

    	var create = new Create({ $$inline: true });

    	var join = new Join({ $$inline: true });

    	return {
    		c: function create_1() {
    			main = element("main");
    			create.$$.fragment.c();
    			t = space();
    			join.$$.fragment.c();
    			add_location(main, file$7, 5, 0, 98);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			mount_component(create, main, null);
    			append(main, t);
    			mount_component(join, main, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(create.$$.fragment, local);

    			transition_in(join.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(create.$$.fragment, local);
    			transition_out(join.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			destroy_component(create);

    			destroy_component(join);
    		}
    	};
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$8, safe_not_equal, []);
    	}
    }

    /* src/App.svelte generated by Svelte v3.9.1 */

    const file$8 = "src/App.svelte";

    // (11:1) <Link href="/home" className="logo">
    function create_default_slot_2(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("My List App");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (14:16) <Link href="/login">
    function create_default_slot_1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Login/Join session");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (18:0) <Router>
    function create_default_slot(ctx) {
    	var t0, t1, t2, current;

    	var route0 = new Route({
    		props: { path: "/home", component: Home },
    		$$inline: true
    	});

    	var route1 = new Route({
    		props: { path: "/list", component: List },
    		$$inline: true
    	});

    	var route2 = new Route({
    		props: {
    		path: "/register",
    		component: Register
    	},
    		$$inline: true
    	});

    	var route3 = new Route({
    		props: { path: "/login", component: Login },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			route0.$$.fragment.c();
    			t0 = space();
    			route1.$$.fragment.c();
    			t1 = space();
    			route2.$$.fragment.c();
    			t2 = space();
    			route3.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(route0, target, anchor);
    			insert(target, t0, anchor);
    			mount_component(route1, target, anchor);
    			insert(target, t1, anchor);
    			mount_component(route2, target, anchor);
    			insert(target, t2, anchor);
    			mount_component(route3, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var route0_changes = {};
    			if (changed.Home) route0_changes.component = Home;
    			route0.$set(route0_changes);

    			var route1_changes = {};
    			if (changed.List) route1_changes.component = List;
    			route1.$set(route1_changes);

    			var route2_changes = {};
    			if (changed.Register) route2_changes.component = Register;
    			route2.$set(route2_changes);

    			var route3_changes = {};
    			if (changed.Login) route3_changes.component = Login;
    			route3.$set(route3_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(route0.$$.fragment, local);

    			transition_in(route1.$$.fragment, local);

    			transition_in(route2.$$.fragment, local);

    			transition_in(route3.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			transition_out(route3.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(route0, detaching);

    			if (detaching) {
    				detach(t0);
    			}

    			destroy_component(route1, detaching);

    			if (detaching) {
    				detach(t1);
    			}

    			destroy_component(route2, detaching);

    			if (detaching) {
    				detach(t2);
    			}

    			destroy_component(route3, detaching);
    		}
    	};
    }

    function create_fragment$9(ctx) {
    	var div, header, t0, nav, ul, li, t1, current;

    	var link0 = new Link({
    		props: {
    		href: "/home",
    		className: "logo",
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var link1 = new Link({
    		props: {
    		href: "/login",
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var router = new Router_1({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			header = element("header");
    			link0.$$.fragment.c();
    			t0 = space();
    			nav = element("nav");
    			ul = element("ul");
    			li = element("li");
    			link1.$$.fragment.c();
    			t1 = space();
    			router.$$.fragment.c();
    			add_location(li, file$8, 13, 12, 366);
    			add_location(ul, file$8, 12, 8, 349);
    			add_location(nav, file$8, 11, 4, 335);
    			add_location(header, file$8, 9, 0, 266);
    			attr(div, "id", "bg");
    			add_location(div, file$8, 8, 0, 252);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, header);
    			mount_component(link0, header, null);
    			append(header, t0);
    			append(header, nav);
    			append(nav, ul);
    			append(ul, li);
    			mount_component(link1, li, null);
    			append(div, t1);
    			mount_component(router, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var link0_changes = {};
    			if (changed.$$scope) link0_changes.$$scope = { changed, ctx };
    			link0.$set(link0_changes);

    			var link1_changes = {};
    			if (changed.$$scope) link1_changes.$$scope = { changed, ctx };
    			link1.$set(link1_changes);

    			var router_changes = {};
    			if (changed.$$scope) router_changes.$$scope = { changed, ctx };
    			router.$set(router_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(link0.$$.fragment, local);

    			transition_in(link1.$$.fragment, local);

    			transition_in(router.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(link0);

    			destroy_component(link1);

    			destroy_component(router);
    		}
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$9, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
