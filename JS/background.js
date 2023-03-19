// import math from './libs/math.js';
chrome.tabs.onReplaced.addListener(function() {
	chrome.tabs.query({ currentWindow: true, active: true }, async function (tabs) {
		thisTab = tabs[0]
		chrome.scripting.executeScript({
			func: showWeather,
			target: {
				tabId: thisTab.id,
				allFrames: true
			},
			injectImmediately: false,
			// args: [changeInfo],
		})
		chrome.scripting.executeScript({
			func: slashCommands,
			target: {
				tabId: thisTab.id,
				allFrames: true
			},
		})
	})
})

chrome.tabs.onUpdated.addListener(function() {
	chrome.tabs.query({ currentWindow: true, active: true }, async function (tabs) {
		thisTab = tabs[0]
		// applyBlock(thisTab)
		// importScripts('/Libs/math.js');
		chrome.scripting.executeScript({
			func: showWeather,
			target: {
				tabId: thisTab.id,
				allFrames: true
			},
			injectImmediately: false,
			// args: [changeInfo],
		})
		chrome.scripting.executeScript({
			func: slashCommands,
			target: {
				tabId: thisTab.id,
				allFrames: true
			},
		})
	})
})
function showWeather() {
	function calculate(searchQuery) {
		// Remove all whitespace from the search query
		searchQuery = searchQuery.replace(/\s+/g, "");

		// Define a regular expression to match exponents
		const exponentRegex = /(\d+\.?\d*)\^(\d+\.?\d*)/;

		// Define a regular expression to match square roots
		const sqrtRegex = /sqrt\((\d+\.?\d*)\)/;

		// Define a regular expression to match basic math operations
		const mathRegex = /(\d+\.?\d*)\s*([\+\-\*\/])\s*(\d+\.?\d*)/;

		// Evaluate exponents first
		let match = searchQuery.match(exponentRegex);
		let result = null;

		while (match !== null) {
			// Extract the operands from the match
			const operand1 = Number(match[1]);
			const operand2 = Number(match[2]);

			// Perform the exponentiation operation
			result = Math.pow(operand1, operand2);

			// Replace the exponentiation in the search query with the result
			searchQuery = searchQuery.replace(match[0], result);

			// Look for the next exponentiation operation
			match = searchQuery.match(exponentRegex);
		}

		// Evaluate square roots next
		match = searchQuery.match(sqrtRegex);

		while (match !== null) {
			// Extract the operand from the match
			const operand = Number(match[1]);

			// Perform the square root operation
			result = Math.sqrt(operand);

			// Replace the square root in the search query with the result
			searchQuery = searchQuery.replace(match[0], result);

			// Look for the next square root operation
			match = searchQuery.match(sqrtRegex);
		}

		// Evaluate the innermost parentheses next, recursively
		match = searchQuery.match(/\(([^\(\)]+)\)/);

		while (match !== null) {
			// Evaluate the expression within the parentheses
			const expression = match[1];
			const result = calculate(expression);

			// Replace the parentheses in the search query with the result
			searchQuery = searchQuery.replace(`(${expression})`, result);

			// Look for the next set of parentheses
			match = searchQuery.match(/\(([^\(\)]+)\)/);
		}

		// Evaluate any remaining math operations
		match = searchQuery.match(mathRegex);

		while (match !== null) {
			// Extract the operator and operands from the match
			const operator = match[2];
			const operand1 = Number(match[1]);
			const operand2 = Number(match[3]);

			// Perform the calculation based on the operator
			switch (operator) {
			case "+":
				result = operand1 + operand2;
				break;
			case "-":
				result = operand1 - operand2;
				break;
			case "*":
				result = operand1 * operand2;
				break;
			case "/":
				result = operand1 / operand2;
				break;
			default:
				break;
			}
			
			// Replace the math operation in the search query with the result
			searchQuery = searchQuery.replace(match[0], result);
			
			// Look for the next math operation
			match = searchQuery.match(mathRegex);
		}
		
		// Return the final result
		return searchQuery;
	}


	var intervalId = setInterval(function(){
		if(document.querySelector("#q")) {
			// only execute code once
			clearInterval(intervalId);
			try {
				HTMLAdded
			} catch(e) {
				HTMLAdded = false
			}
			if(HTMLAdded == false) {
				HTMLAdded = true

				const searchQuery = String(document.getElementById("q").value);
				const regex = /([0-9()+\-*\/^.√]|sqrt\(\d+\.?\d*\))+/g;

				const searchQueryEquation = (searchQuery.match(regex) || []).join('');;
				const matches = regex.test(searchQuery);
				if(matches == true && !document.getElementById("q").value.startsWith("/timecalculator")) {
					const result = calculate(searchQueryEquation);
					if(searchQueryEquation != result) {
						document.getElementById("urls").insertAdjacentHTML("afterbegin", `
							<article id="mycalculator" class="result result-default">
								<h3>Calculator</h3>
								<p class="content" style="
										border: 1px solid var(--color-base-font);
										border-radius: 10px;
										padding: 10px 12px;
									">
									${searchQueryEquation} = ${result}
								</p>
								<div class="engines"></div>
								<div class="break"></div>
							</article>
						`)
					}
				}

				if(searchQuery.includes("weather")) {

					try {
						// remove the "weather" keyword from the query
						const query = searchQuery.replace('weather', '').trim();

						// set a default location. generate here if location is not set
						if (query === '') {
							document.getElementById("urls").insertAdjacentHTML("afterbegin", `
								<article id="myweather" class="result result-default">
									<h3>MyWeather</h3>
									<p class="content" style="
											border: 1px solid var(--color-base-font);
											border-radius: 10px;
											padding: 10px 12px;
										">
										<b>PRO TIP:</b> You can either directly go to MyWeather to search for your location or you can search for it. For example, to get the weather in London, you can search <code>weather london</code>. You can even make it more specific, like <code>weather london canada</code>.
									</p>
									<div class="engines"></div>
									<div class="break"></div>
								</article>
							`)
						}
						else {
							// construct the Nominatim API endpoint URL with the query parameter
							const endpointUrl = `https://nominatim.openstreetmap.org/search.php?q=${query}&format=json&limit=1`;

							// make a fetch request to the endpoint and handle the response
							fetch(endpointUrl)
							.then(response => response.json())
							.then(data => {
								// extract the coordinates from the first result
								const result = data[0];
								const latitude = result.lat;
								const longitude = result.lon;
								
								// log the coordinates to the console
								console.log(`Current location: ${result.display_name}`);
								document.getElementById("urls").insertAdjacentHTML("afterbegin", `
									<article id="myweather" class="result result-default">
										<h3>MyWeather</h3>
										<p class="content">
											<iframe id="myweather-iframe" allow-same-origin src="https://weather.dantenl.com/api/v1/iframe.php?lat=${latitude}&lon=${longitude}" style=
												"border: 1px solid var(--color-base-font);
												border-radius: 10px; 
												overflow: hidden;
												height: 200px" 
											frameborder="0" scrolling="no" />
										</p>
										<div class="engines"></div>
										<div class="break"></div>
									</article>
								`)
							})
						}
						// })
					} catch(error) {
						// handle any errors that occur during the fetch request
						console.error(`Error fetching location data: ${error}`);
						document.getElementById("urls").insertAdjacentHTML("afterbegin", `
							<article id="myweather" class="result result-default">
								<h3>MyWeather</h3>
								<p class="content" style="
									border: 1px solid var(--color-base-font);
									border-radius: 10px;
									padding: 10px 12px;
								">
									Unfortunately, we could not get the coordinates of this location
								</p>
								<div class="engines"></div>
								<div class="break"></div>
							</article>
						`)
					}
				}
			
			}
		}
	})
}

function slashCommands() {
	function getRandomBetweenTwo(min, max) {
		return Math.round(Math.random() * (max - min) + min);
	}
	function changeTime(time, fromTimeZone, toTimeZone) {
		const fromOffset = getTimezoneOffsetInMinutes(fromTimeZone);
		const toOffset = getTimezoneOffsetInMinutes(toTimeZone);
		const timeParts = time.match(/(\d+)(?::(\d\d))?\s*(p?)/i);
		let hours = parseInt(timeParts[1], 10);
		if (hours === 12 && !timeParts[3]) {
			hours = 0;
		}
		else if (hours !== 12 && timeParts[3]) {
			hours += 12;
		}
		let minutes = parseInt(timeParts[2], 10) || 0;
		let fromTime = new Date();
		fromTime.setHours(hours, minutes - fromOffset, 0);
		let toTime = new Date(fromTime.getTime() + (fromOffset + toOffset) * 60000);
		let toHours = toTime.getHours();
		let toMinutes = toTime.getMinutes();
		if (toHours > 12) {
			toHours -= 12;
			toMinutes += "pm";
		} else if (toHours === 12) {
			toMinutes += "pm";
		} else {
			toMinutes += "am";
		}
		return toHours + ":" + (toMinutes < 10 ? "0" : "") + toMinutes;
	}

	function getTimezoneOffsetInMinutes(timezone) {
		const date = new Date();
		const localTime = date.toLocaleString('en-US', { timeZone: timezone });
		const timeZoneOffsetInMilliseconds = localTime.split(/[\s,]+/).pop();
		const timeZoneOffsetInMinutes = timeZoneOffsetInMilliseconds === 'GMT' ? 0 : parseInt(timeZoneOffsetInMilliseconds.slice(3,6)) * 60;
		console.log(timeZoneOffsetInMinutes)
		return timeZoneOffsetInMinutes;
	}
	function getTimeUntilDate(dateString) {
		const dateParts = dateString.split('-');
		const inputDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
		const currentDate = new Date();
		const timeDiff = inputDate.getTime() - currentDate.getTime();
		const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
		
		if (daysDiff === 0) {
			return "today";
		} else if (daysDiff === 1) {
			return "tomorrow";
		} else if (daysDiff <= 7) {
			return `in ${daysDiff} days`;
		} else if (daysDiff <= 14) {
			return "in 1 week";
		} else if (daysDiff <= 21) {
			return "in 2 weeks";
		} else if (daysDiff <= 28) {
			return "in 3 weeks";
		} else {
			const weeksDiff = Math.floor(daysDiff / 7);
			return `in ${weeksDiff} weeks`;
		}
	}








	var intervalId = setInterval(function(){
		if(document.querySelector("#q")) {
			// only execute code once
			clearInterval(intervalId);
			try {
				SlashAdded
			} catch(e) {
				SlashAdded = false
			}
			if(SlashAdded == false) {
				SlashAdded = true

				const searchQuery = document.getElementById("q").value
				if(searchQuery.toLowerCase().startsWith("/weather location:")) {
					document.getElementById("q").value = searchQuery.replace("location:", "").replace("/", "")
					document.getElementById("search").submit()
				}
				if(searchQuery.toLowerCase().startsWith("/calculate equation:")) {
					document.getElementById("q").value = searchQuery.replace("/calculate equation:", "")
					document.getElementById("search").submit()
				}
				if(searchQuery.toLowerCase().startsWith("/random min:")) {
					var str = document.getElementById("q").value
					var regex = /(\w+):(\w+)/g;
					var arr = [];
					var match;
					while (match = regex.exec(str)) {
						arr.push(match[2]);
					}
					var random_number = getRandomBetweenTwo(arr[0], arr[1])
					document.getElementById("urls").insertAdjacentHTML("afterbegin", `
						<article id="random" class="result result-default">
							<h3>Calculator</h3>
							<p class="content" style="
									border: 1px solid var(--color-base-font);
									border-radius: 10px;
									padding: 10px 12px;
								">
								A random number between <code>${arr[0]}</code> and <code>${arr[1]}</code> is <b><code>${random_number}</code></b>
							</p>
							<div class="engines"></div>
							<div class="break"></div>
						</article>
					`)

				}
				// if (searchQuery.toLowerCase().startsWith("/time")) {
				// 	// Get the query string and extract the timezone information
				// 	var str = document.getElementById("q").value
				// 	var regex = /(\w+):(\w+)/g;
				// 	var arr = [];
				// 	var match;
				// 	while (match = regex.exec(str)) {
				// 		console.log(match)
				// 		arr.push(match[2]);
				// 	}
				// 	// TODO: Make it actually get the date instead of first number.
				// 	// TODO: Make it only show the date calculator
				// 	console.log(arr)
				// 	var random_number = changeTime(arr[0], arr[1], arr[2])
				// 	document.getElementById("urls").insertAdjacentHTML("afterbegin", `
				// 		<article id="random" class="result result-default">
				// 			<h3>Calculator</h3>
				// 			<p class="content" style="
				// 					border: 1px solid var(--color-base-font);
				// 					border-radius: 10px;
				// 					padding: 10px 12px;
				// 				">
				// 				A random number between <code>${arr[0]}</code> and <code>${arr[1]}</code> is <b><code>${random_number}</code></b>
				// 			</p>
				// 			<div class="engines"></div>
				// 			<div class="break"></div>
				// 		</article>
				// 	`)
				// }
				if(searchQuery.toLowerCase().includes("/timecalculator")) {
					var str = document.getElementById("q").value
					var date = str.replace("/timecalculator date:", "")
					var difference = getTimeUntilDate(date)
					document.getElementById("urls").insertAdjacentHTML("afterbegin", `
						<article id="timecalc" class="result result-default">
							<h3>Time calculator</h3>
							<p class="content" style="
									border: 1px solid var(--color-base-font);
									border-radius: 10px;
									padding: 10px 12px;
								">
								${date} (DD-MM-YY) is ${difference}.
							</p>
							<div class="engines"></div>
							<div class="break"></div>
						</article>
					`)

				}
				document.getElementById("q").addEventListener("input", function() {
					if (this.value.startsWith("/")) {
						// slash command, enable autocomplete
						var autocompleteboxes = document.getElementsByClassName("autocomplete");
						for (var i = 0; i < autocompleteboxes.length; i++) {
							// Distribute(slides.item(i));
							if(autocompleteboxes[i].getAttribute("id") != "slash_box") {
								autocompleteboxes[i].style.visibility = "hidden"
							}
						}
						if(!document.getElementById("slash_box")) {
							console.log(document.getElementsByClassName("autocomplete"))
							const submit_button = document.getElementById("send_search")
							// console.log(autocomplete)
							submit_button.insertAdjacentHTML("afterend", `
								<div id="slash_box" class="autocomplete open">
									<ul id="slash_list"></ul>
								</div>
							`)
							let inputField = document.getElementById('q');
							let ulField = document.getElementById('slash_list');
							inputField.addEventListener('input', changeAutoComplete);
							ulField.addEventListener('click', selectItem);
							// default data
							let autoCompleteValues = autoComplete("/");
							autoCompleteValues.forEach(value => { addItem(value); })
							// functions for autocomplete

							function changeAutoComplete({ target }) {
								let data = target.value;
								ulField.innerHTML = ``;
								if (data.length) {
									let autoCompleteValues = autoComplete(data);
									autoCompleteValues.forEach(value => { addItem(value); });
								}
							}

							function autoComplete(inputValue) {
								let destination = ["/weather location:", "/calculate equation:", "/random min: max:", "/timecalculator date:DD-MM-YY"];
								return destination.filter(
									(value) => value.toLowerCase().includes(inputValue.toLowerCase())
								);
							}

							function addItem(value) {
								ulField.innerHTML = ulField.innerHTML + `<li>${value}</li>`;
							}

							function selectItem({ target }) {
								if (target.tagName === 'LI') {
									inputField.value = target.textContent;
									ulField.innerHTML = ``;
									inputField.focus()
								}
							}
						}
					} else {
						if(document.getElementById("slash_box")) {
							document.getElementById("slash_box").remove()
							document.getElementsByClassName("autocomplete")[0].style.visibility = "visible"
							// no slash command, enable autocomplete

						}
					}
				})
			}
		}
	})

}

