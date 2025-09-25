// Check if copilot parameter exists in URL
const urlParams = new URLSearchParams(window.location.search);
const shouldLoadCopilot = urlParams.has('copilotEditor') || urlParams.has('copilotPreview');
 
if (shouldLoadCopilot) {
    // Initialize copilot when DOM is ready
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('Initializing New copilot...');
        
        // Conditionally import uploadAsset based on stage/prod
        let uploadAsset;
        const isProd = urlParams.get('copilot-prod') === '1';
        if (isProd) {
            const { uploadAsset: prodUploadAsset } = await import('./asset-upload.js');
            uploadAsset = prodUploadAsset;
            console.log('Using production uploadAsset');
        } else {
            const { uploadAsset: stageUploadAsset } = await import('./asset-upload-stage.js');
            uploadAsset = stageUploadAsset;
            console.log('Using stage uploadAsset');
        }
        
        const domain = urlParams.get('copilot-prod') === '1' 
            ? 'copilot.adobedemo.com' 
            : 'stage.pilot.adobedemo.com';

        // Function to inject CSS
        const injectCSS = () => {
            if (!document.getElementById('copilot-editor-css')) {
                const link = document.createElement('link');
                link.id = 'copilot-editor-css';
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = `https://${domain}/editor/editor.css`;
                link.media = 'all';
                
                // Handle loading errors
                link.onerror = () => console.error('Failed to load copilot CSS');
                link.onload = () => console.log('Copilot CSS loaded successfully');
                
                document.head.appendChild(link);
            }
        };

        // Function to inject Script
        const injectScript = () => {
            if (!document.getElementById('copilot-editor-script')) {
                const script = document.createElement('script');
                script.id = 'copilot-editor-script';
                script.type = 'module';
                script.src = `https://${domain}/editor/editor.js?ims=explicit`;
                
                // Handle loading errors
                script.onerror = () => console.error('Failed to load copilot script');
                script.onload = () => console.log('Copilot script loaded successfully');
                
                // Ensure body exists before appending
                if (document.body) {
                    document.body.appendChild(script);
                } else {
                    // If body doesn't exist yet, wait for it
                    window.addEventListener('load', () => {
                        document.body.appendChild(script);
                    });
                }
            }
        };

        // Inject CSS first
        injectCSS();

        // Then inject script
        injectScript();


        console.log('New Copilot initialization complete');

        document.addEventListener('copilot-publish', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const {projectId, demoId} = e.detail??{};
            console.log('Copilot publish p:'+projectId + ' d:'+demoId);
            if (uploadAsset) {
                uploadAsset();
            } else {
                console.error('uploadAsset function not available');
            }
          })
    },{once: true});

    // Backup initialization in case DOMContentLoaded already fired
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('DOM already loaded, initializing copilot immediately...');
        document.dispatchEvent(new Event('DOMContentLoaded'));
    }
} else {
    console.log('Copilot not enabled. Add ?copilotEditor or ?copilotPreview to URL to enable.');
} 