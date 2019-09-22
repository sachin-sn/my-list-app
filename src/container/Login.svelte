<script>
import Join from './Join.svelte'
let email, password;

function joinSession(){

}
</script>

<main>
<Join />
<section class="input-form">
    <section class="input-block">
		<label>Email:</label>
		<input type="email" class="input-text" bind:value={email}/>
	</section>
    <section class="input-block">
		<label>Password</label>
		<input type="password" class="input-text" bind:value={password}/>
	</section>
	<button class="success">Login</button>
	<button class="default">Forgot password</button>
	<a href='./'>Register</a>
</section>
</main>