document.addEventListener("DOMContentLoaded", function() {
  loadFromLocalStorage();
  
  document.getElementsByClassName("wyslij")[0].addEventListener("click", function() {

    const textValue = document.getElementById("utworz1").value;
    const dateValue = document.getElementById("utworz2").value;
    



    const resultBox = document.getElementById("result-box");
    
    const container = document.createElement("div");
  container.innerHTML = `
    <div>
    <input type="checkbox">   
    <span class="text-label" data-value="${textValue}">${textValue}</span> - 
    <span class="date-label" data-value="${dateValue}">${dateValue}</span>
    <button class="delete">usuń </button> <br>
      </div>
`;
    resultBox.appendChild(container);
    saveToLocalStorage();
  });
    

  document.addEventListener("click", function(event) {
    if (event.target.classList.contains("delete")) {
      event.target.parentElement.remove();
      saveToLocalStorage();
    }
  });

    document.addEventListener("click", function(event) {
    if (event.target.classList.contains("text-label")) {
      const label = event.target;
      const currentText = label.getAttribute("data-value");
      
      const input = document.createElement("input");
      input.type = "text";
      input.value = currentText;
      
      label.replaceWith(input);
      input.focus();
      
      input.addEventListener("blur", function() {
        const newLabel = document.createElement("span");
        newLabel.className = "text-label";
        newLabel.setAttribute("data-value", input.value);
        newLabel.textContent = input.value;
        input.replaceWith(newLabel);
        saveToLocalStorage();
      });
      
      input.addEventListener("keypress", function(e) {
        if (e.key === "Enter") input.blur();
      });
    }
  });

 document.addEventListener("click", function(event) {
    if (event.target.classList.contains("date-label")) {
      const label = event.target;
      const currentDate = label.getAttribute("data-value");
      
      const input = document.createElement("input");
      input.type = "date";
      input.value = currentDate;
      
      label.replaceWith(input);
      input.focus();
      
      input.addEventListener("blur", function() {
        const newLabel = document.createElement("span");
        newLabel.className = "date-label";
        newLabel.setAttribute("data-value", input.value);
        newLabel.textContent = input.value;
        input.replaceWith(newLabel);
        saveToLocalStorage();
      });
      
      input.addEventListener("keypress", function(e) {
        if (e.key === "Enter") input.blur();
      });
    }
  });


  

  document.addEventListener("input", function(event) {
    if (event.target.classList.contains("search")) {
      const query = event.target.value.toLowerCase();
      if (query.length >= 2) {
        document.querySelectorAll(".text-label").forEach(label => {
          const text = label.getAttribute("data-value").toLowerCase();
          if (text.includes(query)) {
            label.innerHTML = label.getAttribute("data-value").replace(
              new RegExp(query, "gi"),
              '<mark>$&</mark>'
            );
            label.parentElement.style.display = "";
          } else {
            label.parentElement.style.display = "none";
          }
        });
      } else {
        document.querySelectorAll(".text-label").forEach(label => {
          label.innerHTML = label.getAttribute("data-value");
          label.parentElement.style.display = "";
        });
      }
    }
  });

  document.addEventListener("change", function(event) {
    if (event.target.type === "checkbox") {
      saveToLocalStorage();
    }
  });

  function saveToLocalStorage() {
    const items = [];
    document.querySelectorAll("#result-box > div > div").forEach(div => {
      const textLabel = div.querySelector(".text-label");
      const dateLabel = div.querySelector(".date-label");
      const checkbox = div.querySelector("input[type='checkbox']");
      
      items.push({
        text: textLabel.getAttribute("data-value"),
        date: dateLabel.getAttribute("data-value"),
        checked: checkbox.checked
      });
    });
    
    localStorage.setItem("todoList", JSON.stringify(items));
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem("todoList");
    if (saved) {
      const items = JSON.parse(saved);
      const resultBox = document.getElementById("result-box");
      
      items.forEach(item => {
        const container = document.createElement("div");
        container.innerHTML = `
          <div>
          <input type="checkbox" ${item.checked ? 'checked' : ''}>   
          <span class="text-label" data-value="${item.text}">${item.text}</span> - 
          <span class="date-label" data-value="${item.date}">${item.date}</span>
          <button class="delete">delete</button> <br>
          </div>
        `;
        resultBox.appendChild(container);
      });
    }
  }

});