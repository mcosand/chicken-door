function updateState() {
  return fetch('/getstate')
  .then(function(r) { return r.json() })
  .then(updateButtons)
}

function handleButton(action) {
  fetch('/' + action, {method: 'POST'})
	.then(function() {
		console.log('done with toggle post');
return updateState()
	})

/*  var timer = setInterval(function() {
timeout = timeout - 1000;
	  console.log(timeout);
	  if (timeout <= 0) {
		  clearTimeout(timer);
	  }
  }, 1000);
*/
}

function updateButtons(state) {
  console.log(state)
  document.getElementById('stop').style.display = state.moving ? 'block' : 'none'
  document.getElementById('open').style.display = state.canOpen ? 'block' : 'none'
  document.getElementById('close').style.display = state.canClose ? 'block' : 'none'
  if (state.moving) {
    setTimeout(updateState, 500)
  }
}
