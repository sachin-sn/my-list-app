
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
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

    /* src/App.svelte generated by Svelte v3.9.1 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	child_ctx.index = i;
    	return child_ctx;
    }

    // (35:0) {#each list as item,index}
    function create_each_block(ctx) {
    	var section, p, label0, t0_value = ctx.index+1 + "", t0, t1, t2_value = ctx.item.name + "", t2, br0, t3, label1, t5, t6_value = ctx.item.quantity + "", t6, br1, t7, label2, t9, t10_value = ctx.item.amount + "", t10, t11, button, t13;

    	return {
    		c: function create() {
    			section = element("section");
    			p = element("p");
    			label0 = element("label");
    			t0 = text(t0_value);
    			t1 = text(". ");
    			t2 = text(t2_value);
    			br0 = element("br");
    			t3 = space();
    			label1 = element("label");
    			label1.textContent = "Quantity";
    			t5 = text(" - ");
    			t6 = text(t6_value);
    			br1 = element("br");
    			t7 = space();
    			label2 = element("label");
    			label2.textContent = "Amount";
    			t9 = text(" - ");
    			t10 = text(t10_value);
    			t11 = space();
    			button = element("button");
    			button.textContent = "Delete";
    			t13 = space();
    			add_location(label0, file, 37, 3, 760);
    			add_location(br0, file, 37, 40, 797);
    			add_location(label1, file, 38, 3, 806);
    			add_location(br1, file, 38, 44, 847);
    			add_location(label2, file, 39, 3, 856);
    			add_location(p, file, 36, 2, 753);
    			attr(button, "class", "failure");
    			add_location(button, file, 41, 2, 903);
    			attr(section, "class", "listItem");
    			add_location(section, file, 35, 1, 724);
    		},

    		m: function mount(target, anchor) {
    			insert(target, section, anchor);
    			append(section, p);
    			append(p, label0);
    			append(label0, t0);
    			append(label0, t1);
    			append(label0, t2);
    			append(p, br0);
    			append(p, t3);
    			append(p, label1);
    			append(p, t5);
    			append(p, t6);
    			append(p, br1);
    			append(p, t7);
    			append(p, label2);
    			append(p, t9);
    			append(p, t10);
    			append(section, t11);
    			append(section, button);
    			append(section, t13);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(section);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div, header, a, t1, main, section3, section0, label0, t3, input0, t4, section1, label1, t6, input1, t7, section2, label2, t9, input2, t10, button0, t12, button1, t14, dispose;

    	var each_value = ctx.list;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div = element("div");
    			header = element("header");
    			a = element("a");
    			a.textContent = "My List App";
    			t1 = space();
    			main = element("main");
    			section3 = element("section");
    			section0 = element("section");
    			label0 = element("label");
    			label0.textContent = "Name:";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			section1 = element("section");
    			label1 = element("label");
    			label1.textContent = "Quantity:";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			section2 = element("section");
    			label2 = element("label");
    			label2.textContent = "Amount:";
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			button0 = element("button");
    			button0.textContent = "Add";
    			t12 = space();
    			button1 = element("button");
    			button1.textContent = "Reset";
    			t14 = space();

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(a, "href", "/");
    			add_location(a, file, 15, 1, 139);
    			add_location(header, file, 14, 0, 129);
    			add_location(label0, file, 20, 2, 246);
    			attr(input0, "type", "text");
    			attr(input0, "class", "input-text");
    			add_location(input0, file, 21, 2, 269);
    			attr(section0, "class", "input-block");
    			add_location(section0, file, 19, 1, 214);
    			add_location(label1, file, 24, 2, 372);
    			attr(input1, "type", "number");
    			attr(input1, "class", "input-text");
    			add_location(input1, file, 25, 2, 399);
    			attr(section1, "class", "input-block");
    			add_location(section1, file, 23, 1, 340);
    			add_location(label2, file, 28, 2, 508);
    			attr(input2, "type", "number");
    			attr(input2, "class", "input-text");
    			add_location(input2, file, 29, 2, 533);
    			attr(section2, "class", "input-block");
    			add_location(section2, file, 27, 1, 476);
    			attr(button0, "class", "success");
    			add_location(button0, file, 31, 1, 608);
    			attr(button1, "class", "failure");
    			add_location(button1, file, 32, 1, 646);
    			attr(section3, "class", "input-form");
    			add_location(section3, file, 18, 0, 184);
    			add_location(main, file, 17, 0, 177);
    			attr(div, "id", "bg");
    			add_location(div, file, 13, 0, 115);

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
    			insert(target, div, anchor);
    			append(div, header);
    			append(header, a);
    			append(div, t1);
    			append(div, main);
    			append(main, section3);
    			append(section3, section0);
    			append(section0, label0);
    			append(section0, t3);
    			append(section0, input0);

    			set_input_value(input0, ctx.name);

    			append(section3, t4);
    			append(section3, section1);
    			append(section1, label1);
    			append(section1, t6);
    			append(section1, input1);

    			set_input_value(input1, ctx.quantity);

    			append(section3, t7);
    			append(section3, section2);
    			append(section2, label2);
    			append(section2, t9);
    			append(section2, input2);

    			set_input_value(input2, ctx.amount);

    			append(section3, t10);
    			append(section3, button0);
    			append(section3, t12);
    			append(section3, button1);
    			append(main, t14);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.name && (input0.value !== ctx.name)) set_input_value(input0, ctx.name);
    			if (changed.quantity) set_input_value(input1, ctx.quantity);
    			if (changed.amount) set_input_value(input2, ctx.amount);

    			if (changed.list) {
    				each_value = ctx.list;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, null);
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
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let list = [
    	{
    		name:"abcd",
    		quantity:10,
    		amount:100
    	}
    ];
    let name, amount, quantity;

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

    	return {
    		list,
    		name,
    		amount,
    		quantity,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
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
