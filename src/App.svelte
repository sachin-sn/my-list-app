<script>
let list = [
	{
		name:"Item 1",
		description:"Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus sunt quam doloribus quasi distinction",
		quantity:0,
		amount:0
	},
	{
		name:"Item 2",
		description:"Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus sunt quam doloribus quasi distinction",
		quantity:0,
		amount:0
	},
	{
		name:"Item 3",
		description:"Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus sunt quam doloribus quasi distinction",
		quantity:0,
		amount:0
	},
	{
		name:"Item 4",
		description:"Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus sunt quam doloribus quasi distinction",
		quantity:0,
		amount:0
	},
	{
		name:"Item 5",
		description:"Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus sunt quam doloribus quasi distinction",
		quantity:0,
		amount:0
	},
	{
		name:"Item 6",
		description:"Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus sunt quam doloribus quasi distinction",
		quantity:0,
		amount:0
	}
]
</script>

<div id="bg">
<header>
	<a href="/">My List App</a>
</header>
<main>
{#each list as item}
	<section class="listItem">
		<label>{item.name}</label> - {item.description}
		<section class="input-block">
			<label>Quantity:</label>
			<input type="number" class="input-text"/>
		</section>
		<section class="input-block">
			<label>Amount:</label>
			<input type="number" class="input-text"/>
		</section>
		<button>Add</button>
	</section>
{/each}
</main>
</div>