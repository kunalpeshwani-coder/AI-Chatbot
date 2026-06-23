(function () {
    var script = document.currentScript || (function () {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();

    var chatbotKey = script.getAttribute('data-chatbot');
    if (!chatbotKey) {
        console.error('[AI Chatbot Widget] Missing data-chatbot attribute on the script tag.');
        return;
    }

    var origin = new URL(script.src).origin;
    var open = false;

    var container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '999999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-end';
    container.style.fontFamily = 'sans-serif';

    var iframe = document.createElement('iframe');
    iframe.src = origin + '/widget/' + chatbotKey;
    iframe.style.width = '380px';
    iframe.style.height = '600px';
    iframe.style.maxHeight = '80vh';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '16px';
    iframe.style.boxShadow = '0 20px 50px rgba(0,0,0,0.35)';
    iframe.style.marginBottom = '12px';
    iframe.style.display = 'none';
    iframe.title = 'Chat widget';

    var button = document.createElement('button');
    button.setAttribute('aria-label', 'Open chat');
    button.style.width = '56px';
    button.style.height = '56px';
    button.style.borderRadius = '50%';
    button.style.background = 'linear-gradient(135deg, #818cf8, #4338ca)';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 8px 20px rgba(67,56,202,0.4)';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.transition = 'transform 0.15s ease';
    button.onmouseenter = function () { button.style.transform = 'scale(1.05)'; };
    button.onmouseleave = function () { button.style.transform = 'scale(1)'; };

    var iconChat = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"/></svg>';
    var iconClose = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>';
    button.innerHTML = iconChat;

    button.addEventListener('click', function () {
        open = !open;
        iframe.style.display = open ? 'block' : 'none';
        button.innerHTML = open ? iconClose : iconChat;
    });

    container.appendChild(iframe);
    container.appendChild(button);
    document.body.appendChild(container);
})();
