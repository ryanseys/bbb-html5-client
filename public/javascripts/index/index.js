//validates form and input for data
function validateForm(form, input) {
	var x = document.forms[form][input].value;
	if (x == null || x == "") {
		alert("Please enter a username");
		return false;
	}
}