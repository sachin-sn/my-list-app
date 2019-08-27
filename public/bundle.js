
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

    // (68:0) {#each list as item,index}
    function create_each_block(ctx) {
    	var section, p, label0, t0_value = ctx.index+1 + "", t0, t1, t2_value = ctx.item.name + "", t2, br0, t3, label1, t5, span0, t6_value = ctx.item.quantity + "", t6, br1, t7, label2, t9, span1, t10_value = ctx.item.amount + "", t10, br2, t11, label3, t13, span2, t14_value = ctx.item.amount * ctx.item.quantity + "", t14, t15, button, t17, dispose;

    	function click_handler(...args) {
    		return ctx.click_handler(ctx, ...args);
    	}

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
    			t5 = text(" : ");
    			span0 = element("span");
    			t6 = text(t6_value);
    			br1 = element("br");
    			t7 = space();
    			label2 = element("label");
    			label2.textContent = "M.R.P per piece";
    			t9 = text(" : ");
    			span1 = element("span");
    			t10 = text(t10_value);
    			br2 = element("br");
    			t11 = space();
    			label3 = element("label");
    			label3.textContent = "Total price";
    			t13 = text(" : ");
    			span2 = element("span");
    			t14 = text(t14_value);
    			t15 = space();
    			button = element("button");
    			button.textContent = "Delete";
    			t17 = space();
    			add_location(label0, file, 70, 3, 1485);
    			add_location(br0, file, 70, 40, 1522);
    			add_location(label1, file, 71, 3, 1531);
    			add_location(span0, file, 71, 29, 1557);
    			add_location(br1, file, 71, 57, 1585);
    			add_location(label2, file, 72, 3, 1594);
    			add_location(span1, file, 72, 36, 1627);
    			add_location(br2, file, 72, 62, 1653);
    			add_location(label3, file, 73, 3, 1662);
    			add_location(span2, file, 73, 32, 1691);
    			add_location(p, file, 69, 2, 1478);
    			attr(button, "class", "failure");
    			add_location(button, file, 75, 2, 1743);
    			attr(section, "class", "listItem");
    			add_location(section, file, 68, 1, 1449);
    			dispose = listen(button, "click", click_handler);
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
    			append(p, span0);
    			append(span0, t6);
    			append(p, br1);
    			append(p, t7);
    			append(p, label2);
    			append(p, t9);
    			append(p, span1);
    			append(span1, t10);
    			append(p, br2);
    			append(p, t11);
    			append(p, label3);
    			append(p, t13);
    			append(p, span2);
    			append(span2, t14);
    			append(section, t15);
    			append(section, button);
    			append(section, t17);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.list) && t2_value !== (t2_value = ctx.item.name + "")) {
    				set_data(t2, t2_value);
    			}

    			if ((changed.list) && t6_value !== (t6_value = ctx.item.quantity + "")) {
    				set_data(t6, t6_value);
    			}

    			if ((changed.list) && t10_value !== (t10_value = ctx.item.amount + "")) {
    				set_data(t10, t10_value);
    			}

    			if ((changed.list) && t14_value !== (t14_value = ctx.item.amount * ctx.item.quantity + "")) {
    				set_data(t14, t14_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(section);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div, header, a, t1, main, section3, section0, label0, t3, input0, t4, section1, label1, t6, input1, t7, section2, label2, t9, input2, t10, button0, t12, button1, t14, section4, p0, label3, br0, t16, span0, t17, t18, p1, label4, br1, t20, span1, t21_value = ctx.list.length + "", t21, t22, dispose;

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
    			label2.textContent = "M.R.P per piece:";
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			button0 = element("button");
    			button0.textContent = "Add";
    			t12 = space();
    			button1 = element("button");
    			button1.textContent = "Reset";
    			t14 = space();
    			section4 = element("section");
    			p0 = element("p");
    			label3 = element("label");
    			label3.textContent = "Total cost:";
    			br0 = element("br");
    			t16 = space();
    			span0 = element("span");
    			t17 = text(ctx.total);
    			t18 = space();
    			p1 = element("p");
    			label4 = element("label");
    			label4.textContent = "Total no of Items:";
    			br1 = element("br");
    			t20 = space();
    			span1 = element("span");
    			t21 = text(t21_value);
    			t22 = space();

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(a, "href", "/");
    			add_location(a, file, 38, 1, 631);
    			add_location(header, file, 37, 0, 621);
    			add_location(label0, file, 43, 2, 738);
    			attr(input0, "type", "text");
    			attr(input0, "class", "input-text");
    			add_location(input0, file, 44, 2, 761);
    			attr(section0, "class", "input-block");
    			add_location(section0, file, 42, 1, 706);
    			add_location(label1, file, 47, 2, 864);
    			attr(input1, "type", "number");
    			attr(input1, "class", "input-text");
    			add_location(input1, file, 48, 2, 891);
    			attr(section1, "class", "input-block");
    			add_location(section1, file, 46, 1, 832);
    			add_location(label2, file, 51, 2, 1000);
    			attr(input2, "type", "number");
    			attr(input2, "class", "input-text");
    			add_location(input2, file, 52, 2, 1034);
    			attr(section2, "class", "input-block");
    			add_location(section2, file, 50, 1, 968);
    			attr(button0, "class", "success");
    			add_location(button0, file, 54, 1, 1109);
    			attr(button1, "class", "failure");
    			add_location(button1, file, 55, 1, 1166);
    			attr(section3, "class", "input-form");
    			add_location(section3, file, 41, 0, 676);
    			add_location(label3, file, 59, 2, 1267);
    			add_location(br0, file, 59, 28, 1293);
    			add_location(span0, file, 60, 3, 1302);
    			add_location(p0, file, 58, 1, 1261);
    			add_location(label4, file, 63, 2, 1336);
    			add_location(br1, file, 63, 35, 1369);
    			add_location(span1, file, 64, 2, 1377);
    			add_location(p1, file, 62, 1, 1330);
    			attr(section4, "class", "listItem");
    			add_location(section4, file, 57, 0, 1233);
    			add_location(main, file, 40, 0, 669);
    			attr(div, "id", "bg");
    			add_location(div, file, 36, 0, 607);

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
    			append(main, section4);
    			append(section4, p0);
    			append(p0, label3);
    			append(p0, br0);
    			append(p0, t16);
    			append(p0, span0);
    			append(span0, t17);
    			append(section4, t18);
    			append(section4, p1);
    			append(p1, label4);
    			append(p1, br1);
    			append(p1, t20);
    			append(p1, span1);
    			append(span1, t21);
    			append(main, t22);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.name && (input0.value !== ctx.name)) set_input_value(input0, ctx.name);
    			if (changed.quantity) set_input_value(input1, ctx.quantity);
    			if (changed.amount) set_input_value(input2, ctx.amount);

    			if (changed.total) {
    				set_data(t17, ctx.total);
    			}

    			if ((changed.list) && t21_value !== (t21_value = ctx.list.length + "")) {
    				set_data(t21, t21_value);
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
    ];
    let total = 0;

    let name, amount, quantity;

    function AddItem(){
    	if(name && amount && quantity){
    		let newItem = {
    			name:name,
    			amount:amount,
    			quantity:quantity
    		};
    		$$invalidate('list', list = [...list,newItem]);
    		$$invalidate('total', total = total + (quantity*amount));
    		$$invalidate('name', name = "");
    		$$invalidate('amount', amount="");
    		$$invalidate('quantity', quantity="");
    	}
    }
    function reset(){
    	$$invalidate('name', name = "");
    	$$invalidate('amount', amount = "");
    	$$invalidate('quantity', quantity="");
    }

    function deleteItem(itemIndex){
    	let delItem = list.filter((item,index)=>index===itemIndex)[0];
    	$$invalidate('total', total = total - (delItem.amount * delItem.quantity));
    	$$invalidate('list', list = list.filter((item,index)=>index!==itemIndex));
    	$$invalidate('list', list = [...list]);
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

    	function click_handler({ index }, e) {deleteItem(index);}

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
