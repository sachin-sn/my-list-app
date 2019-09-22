<script>
	import { Router, Route, Link } from 'svero';
	import List from './container/List.svelte'
	import Login from './container/Login.svelte'
	import Register from './container/Register.svelte'
	import Home from './container/Home.svelte'
</script>

<div id="bg">
<header>
	<Link href="/home" className="logo">My List App</Link>
    <nav>
        <ul>
            <li><Link href="/login">Login/Join session</Link></li>
        </ul>
    </nav>
</header>
<Router>
	<Route path="/home" component={Home}/>
	<Route path="/list" component={List}/>
	<Route path="/register" component={Register}/>
	<Route path="/login" component={Login}/>
</Router>
</div>