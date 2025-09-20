chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'pasteToTwitch') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) return;
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        args: [message.link],
        func: (chatLink) => {
          const input = document.querySelector('div[role="textbox"][data-a-target="chat-input"]');
          if (input) {
            input.focus();
            if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
              document.execCommand('insertText', false, chatLink + ' ');
            } else {
              input.innerText += (chatLink + ' ');
            }
            // Курсор в конец
            const range = document.createRange();
            range.selectNodeContents(input);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      });
    });
  }
});
