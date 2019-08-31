
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

    // (115:2) {#each list as item,index}
    function create_each_block(ctx) {
    	var tr, td0, t0_value = ctx.index+1 + "", t0, t1, td1, t2_value = ctx.item.name + "", t2, t3, td2, t4_value = ctx.item.quantity + "", t4, t5, td3, t6_value = ctx.item.amount + "", t6, t7, td4, t8_value = ctx.item.amount * ctx.item.quantity + "", t8, t9, td5, button, t11, dispose;

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
    			add_location(td0, file, 116, 4, 2377);
    			add_location(td1, file, 117, 4, 2400);
    			add_location(td2, file, 118, 4, 2425);
    			add_location(td3, file, 119, 4, 2454);
    			add_location(td4, file, 120, 4, 2481);
    			attr(button, "class", "failure sm");
    			add_location(button, file, 121, 8, 2528);
    			add_location(td5, file, 121, 4, 2524);
    			add_location(tr, file, 115, 3, 2368);
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

    			if ((changed.list) && t8_value !== (t8_value = ctx.item.amount * ctx.item.quantity + "")) {
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

    function create_fragment(ctx) {
    	var div, header, a, t1, main, section3, section0, label0, t3, input0, t4, section1, label1, t6, input1, t7, section2, label2, t9, input2, t10, button0, t12, button1, t14, section4, p, label3, span0, t16, br, t17, label4, span1, t19_value = ctx.list.length + "", t19, t20, section5, table, tr, th0, t22, th1, t24, th2, t26, th3, t28, th4, t30, th5, t32, dispose;

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
    			p = element("p");
    			label3 = element("label");
    			label3.textContent = "Total cost: ";
    			span0 = element("span");
    			t16 = text(ctx.total);
    			br = element("br");
    			t17 = space();
    			label4 = element("label");
    			label4.textContent = "Total no of Items: ";
    			span1 = element("span");
    			t19 = text(t19_value);
    			t20 = space();
    			section5 = element("section");
    			table = element("table");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "#";
    			t22 = space();
    			th1 = element("th");
    			th1.textContent = "Name";
    			t24 = space();
    			th2 = element("th");
    			th2.textContent = "Qty";
    			t26 = space();
    			th3 = element("th");
    			th3.textContent = "M.R.P";
    			t28 = space();
    			th4 = element("th");
    			th4.textContent = "Total";
    			t30 = space();
    			th5 = element("th");
    			th5.textContent = "Action";
    			t32 = space();

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(a, "href", "/");
    			add_location(a, file, 79, 1, 1409);
    			add_location(header, file, 78, 0, 1399);
    			add_location(label0, file, 84, 2, 1516);
    			attr(input0, "type", "text");
    			attr(input0, "class", "input-text");
    			add_location(input0, file, 85, 2, 1539);
    			attr(section0, "class", "input-block");
    			add_location(section0, file, 83, 1, 1484);
    			add_location(label1, file, 88, 2, 1642);
    			attr(input1, "type", "number");
    			attr(input1, "class", "input-text");
    			add_location(input1, file, 89, 2, 1669);
    			attr(section1, "class", "input-block");
    			add_location(section1, file, 87, 1, 1610);
    			add_location(label2, file, 92, 2, 1778);
    			attr(input2, "type", "number");
    			attr(input2, "class", "input-text");
    			add_location(input2, file, 93, 2, 1812);
    			attr(section2, "class", "input-block");
    			add_location(section2, file, 91, 1, 1746);
    			attr(button0, "class", "success");
    			add_location(button0, file, 95, 1, 1887);
    			attr(button1, "class", "failure rt");
    			add_location(button1, file, 96, 1, 1944);
    			attr(section3, "class", "input-form");
    			add_location(section3, file, 82, 0, 1454);
    			add_location(label3, file, 100, 2, 2048);
    			add_location(span0, file, 100, 29, 2075);
    			add_location(br, file, 100, 49, 2095);
    			add_location(label4, file, 101, 2, 2103);
    			add_location(span1, file, 101, 36, 2137);
    			add_location(p, file, 99, 1, 2042);
    			attr(section4, "class", "listItem");
    			add_location(section4, file, 98, 0, 2014);
    			add_location(th0, file, 107, 3, 2229);
    			add_location(th1, file, 108, 3, 2243);
    			add_location(th2, file, 109, 3, 2260);
    			add_location(th3, file, 110, 3, 2276);
    			add_location(th4, file, 111, 3, 2294);
    			add_location(th5, file, 112, 3, 2312);
    			add_location(tr, file, 106, 2, 2221);
    			add_location(table, file, 105, 2, 2211);
    			attr(section5, "class", "listItem");
    			add_location(section5, file, 104, 1, 2182);
    			add_location(main, file, 81, 0, 1447);
    			attr(div, "id", "bg");
    			add_location(div, file, 77, 0, 1385);

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
    			append(section4, p);
    			append(p, label3);
    			append(p, span0);
    			append(span0, t16);
    			append(p, br);
    			append(p, t17);
    			append(p, label4);
    			append(p, span1);
    			append(span1, t19);
    			append(main, t20);
    			append(main, section5);
    			append(section5, table);
    			append(table, tr);
    			append(tr, th0);
    			append(tr, t22);
    			append(tr, th1);
    			append(tr, t24);
    			append(tr, th2);
    			append(tr, t26);
    			append(tr, th3);
    			append(tr, t28);
    			append(tr, th4);
    			append(tr, t30);
    			append(tr, th5);
    			append(table, t32);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.name && (input0.value !== ctx.name)) set_input_value(input0, ctx.name);
    			if (changed.quantity) set_input_value(input1, ctx.quantity);
    			if (changed.amount) set_input_value(input2, ctx.amount);

    			if (changed.total) {
    				set_data(t16, ctx.total);
    			}

    			if ((changed.list) && t19_value !== (t19_value = ctx.list.length + "")) {
    				set_data(t19, t19_value);
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
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    function httpGet() {
    fetch('https://zb4n1zisp5.execute-api.us-east-1.amazonaws.com/dev/getalldata/',{
    	method: 'GET',
    	headers: {
    	'Content-Type': 'application/json'
    	}
    })
    .then((response)=>{
    	if(response.status ==200) {
    		return response.json();
    	}
    });
    }

    function httpPost(payload) {
    fetch('https://zb4n1zisp5.execute-api.us-east-1.amazonaws.com/dev/savedata',{
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
    });
    }

    function instance($$self, $$props, $$invalidate) {
    	let list = [
    ];
    let total = 0;

    let name, amount, quantity;
    function getData () {
    	let data = httpGet();
    	if(data){
    		data = JSON.parse(data);
    		$$invalidate('list', list = [...data]);
    	}
    } 

    function saveData () {
    	httpPost (list);
    }

    setInterval(getData(),1000);
     
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
    		saveData();
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
