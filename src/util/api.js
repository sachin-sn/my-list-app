export const httpGet =() => {
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
export const httpPost = (payload) => {
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