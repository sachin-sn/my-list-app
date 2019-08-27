<script>
let list = [
	{
		name:"abcd",
		quantity:10,
		amount:100
	}
];
let name, amount, quantity;


</script>

<div id="bg">
<header>
	<a href="/">My List App</a>
</header>
<main>
<section class="input-form">
	<section class="input-block">
		<label>Name:</label>
		<input type="text" class="input-text" bind:value={name}/>
	</section>
	<section class="input-block">
		<label>Quantity:</label>
		<input type="number" class="input-text" bind:value={quantity}/>
	</section>
	<section class="input-block">
		<label>Amount:</label>
		<input type="number" class="input-text" bind:value={amount}/>
	</section>
	<button class="success">Add</button>
	<button class="failure">Reset</button>
</section>
{#each list as item,index}
	<section class="listItem">
		<p>
			<label>{index+1}. {item.name}</label><br/>
			<label>Quantity</label> - {item.quantity}<br/>
			<label>Amount</label> - {item.amount}
		</p>
		<button class="failure">Delete</button>
	</section>
{/each}
</main>
</div>