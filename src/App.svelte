<script>
let list = [
];
let total = 0;

let name, amount, quantity;
function httpGet() {
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
}
function httpPost(payload) {
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
}

function getData () {
	httpGet().then(data=>{
		if(data){
			data = JSON.parse(data)
			list = [...data]
		}
	});
}

function saveData () {
	httpPost (list)
}

setInterval(getData(),10000);
 
function AddItem(){
	if(name && amount && quantity){
		let newItem = {
			name:name,
			amount:amount,
			quantity:quantity
		}
		list = [...list,newItem];
		total = total + (quantity*amount);
		name = "";
		amount="";
		quantity="";
		saveData();
	}
}
function reset(){
	name = "";
	amount = "";
	quantity="";
}

function deleteItem(itemIndex){
	let delItem = list.filter((item,index)=>index===itemIndex)[0];
	total = total - (delItem.amount * delItem.quantity);
	list = list.filter((item,index)=>index!==itemIndex);
	list = [...list];
		saveData();
}

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
		<label>M.R.P per piece:</label>
		<input type="number" class="input-text" bind:value={amount}/>
	</section>
	<button class="success" on:click={AddItem}>Add</button>
	<button class="failure rt" on:click={reset}>Reset</button>
</section>
<section class="listItem">
	<p>
		<label>Total cost: </label><span>{total}</span><br/>
		<label>Total no of Items: </label><span>{list.length}</span>
	</p>
</section>
	<section class="listItem">
		<table>
		<tr>
			<th>#</th>
			<th>Name</th>
			<th>Qty</th>
			<th>M.R.P</th>
			<th>Total</th>
			<th>Action</th>
		</tr>
		{#each list as item,index}
			<tr>
				<td>{index+1}</td>
				<td>{item.name}</td>
				<td>{item.quantity}</td>
				<td>{item.amount}</td>
				<td>{item.amount * item.quantity}</td>
				<td><button class="failure sm" on:click={(e)=>{deleteItem(index)}}>Delete</button></td>
			</tr>
		{/each}
		</table>
		<!-- <p>
			<label>{index+1}. {item.name}</label><br/>
			<label>Quantity</label> : <span>{item.quantity}</span><br/>
			<label>M.R.P per piece</label> : <span>{item.amount}</span><br/>
			<label>Total price</label> : <span>{item.amount * item.quantity}</span>
		</p> 
		<button class="failure" on:click={(e)=>{deleteItem(index)}}>Delete</button>-->
	</section>
</main>
</div>