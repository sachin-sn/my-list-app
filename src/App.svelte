<script>
	import { Router, Route, Link } from 'svero';
	import List from './container/List.svelte'
	import Login from './container/Login.svelte'
	import Register from './container/Register.svelte'
</script>

<div id="bg">
<header>
	<Link href="/" className="logo">My List App</Link>
    <nav>
        <ul>
            <li><Link href="/">HOME</Link></li>
        </ul>
    </nav>
</header>
<Router>
	<Route exact path="/" component={List}/>
	<Route path="/register" component={Register}/>
	<Route path="/login" component={Login}/>
</Router>
</div>