<script>
let email, password
</script>

<main>
<section class="input-form">
    <section class="input-block">
		<label>Email:</label>
		<input type="email" class="input-text" bind:value={email}/>
	</section>
    <section class="input-block">
		<label>Password</label>
		<input type="password" class="input-text" bind:value={password}/>
	</section>
    <section class="input-block">
		<label>Retype Password</label>
		<input type="password" class="input-text" bind:value={password}/>
	</section>
	<button class="default">Register</button>
</section>
</main>