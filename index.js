fetch("./quiz.json")
  .then((response) => response.json())
  .then((data) => {
    document.getElementById("json-output").textContent = JSON.stringify(data, null, 2);
  });
