// Wait until the HTML document is fully loaded before running script
document.addEventListener('DOMContentLoaded', () => {

  // Select key elements from the HTML DOM using their IDs
  const interactiveBtn = document.getElementById('interactiveBtn');
  const dynamicMessage = document.getElementById('dynamicMessage');

  // List of fun messages to cycle through when the button is clicked
  const messages = [
    "🚀 You just activated interactive JavaScript!",
    "💡 Tip: You can customize these files to showcase anything you like.",
    "🎉 Great job stepping into web development!",
    "🔥 GitHub Pages makes hosting your custom site super easy!"
  ];

  let messageIndex = 0;

  // Add an event listener to run code whenever the user clicks the button
  interactiveBtn.addEventListener('click', () => {
    // Update the text inside the dynamicMessage paragraph
    dynamicMessage.textContent = messages[messageIndex];
    dynamicMessage.style.marginTop = "1rem";
    dynamicMessage.style.fontWeight = "bold";
    dynamicMessage.style.color = "#2563eb";

    // Cycle through messages, wrapping back to the start
    messageIndex = (messageIndex + 1) % messages.length;
  });

});
