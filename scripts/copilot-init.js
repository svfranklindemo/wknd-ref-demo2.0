/**
 * Copilot Initialization Module
 * Handles initialization of Adobe Copilot and ZDP (Zero Data Platform) editors
 */

// Configuration
const CONFIG = {
    domains: {
        stage: {
            pilot: "https://demo-system-zoltar-demo-pilot-deploy-ethos101-stag-6229b6.stage.cloud.adobe.io",
            editor: "stage.pilot.adobedemo.com"
        },
        prod: {
            pilot: "https://demo-system-zoltar-demo-pilot-deploy-ethos101-prod-23e40d.cloud.adobe.io",
            editor: "copilot.adobedemo.com"
        }
    },
    authDelay: 2000,
    cssId: 'copilot-editor-css',
    scriptId: 'copilot-editor-script'
};

// Utility functions
const getUrlParams = () => new URLSearchParams(window.location.search);

const getSearchParam = (params, param) => params.get(param);

const getSessionParam = (param) => sessionStorage.getItem(param);

const getParamWithFallback = (params, param, sessionKey = null) => {
    return getSearchParam(params, param) || (sessionKey ? getSessionParam(sessionKey) : '') || '';
};

const isProduction = (params, prodParam) => {
    return getSearchParam(params, prodParam) === '1' || getSearchParam(params, 'zdp-env') === 'prod';
};

const getEnvironmentConfig = (isProd) => {
    return isProd ? CONFIG.domains.prod : CONFIG.domains.stage;
};

// Authentication function
const authenticateWithPilot = async (domain, token, tokenName = 'IMS') => {
    try {
        if (!token) {
            console.warn(`No ${tokenName} token found`);
            return false;
        }

        const response = await fetch(`${domain}/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ "accessToken": token }),
        });

        // Wait for configured delay
        await new Promise(resolve => setTimeout(resolve, CONFIG.authDelay));

        if (!response.ok) {
            console.error(`Authentication request failed with status: ${response.status}`);
            return false;
        }

        const data = await response.json();
        const isAuthorized = data?.isAuthorized === "true" || data?.isAuthorized === true;
        
        if (!isAuthorized) {
            console.error('Authentication failed: User not authorized');
            return false;
        } else {
            console.log('Authentication successful');
            return true;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return false;
    }
};

// Asset upload function loader
const loadUploadAsset = async (isProd) => {
    try {
        if (isProd) {
            const { uploadAsset } = await import('./asset-upload.js');
            console.log('Using production uploadAsset');
            return uploadAsset;
        } else {
            const { uploadAsset } = await import('./asset-upload-stage.js');
            console.log('Using stage uploadAsset');
            return uploadAsset;
        }
    } catch (error) {
        console.error('Failed to load upload asset function:', error);
        return null;
    }
};

// CSS injection function
const injectCSS = (domain) => {
    if (document.getElementById(CONFIG.cssId)) {
        return; // Already injected
    }

    const link = document.createElement('link');
    link.id = CONFIG.cssId;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = `https://${domain}/editor/editor.css`;
    link.media = 'all';
    
    link.onerror = () => console.error('Failed to load copilot CSS');
    link.onload = () => console.log('Copilot CSS loaded successfully');
    
    document.head.appendChild(link);
};

// Script injection function
const injectScript = (domain) => {
    if (document.getElementById(CONFIG.scriptId)) {
        return; // Already injected
    }

    const script = document.createElement('script');
    script.id = CONFIG.scriptId;
    script.type = 'module';
    script.src = `https://${domain}/editor/editor.js?ims=explicit`;
    
    script.onerror = () => console.error('Failed to load copilot script');
    script.onload = () => console.log('Copilot script loaded successfully');
    
    // Ensure body exists before appending
    if (document.body) {
        document.body.appendChild(script);
    } else {
        window.addEventListener('load', () => {
            document.body.appendChild(script);
        });
    }
};

// Publish event handler
const setupPublishHandler = (uploadAsset, type = 'Copilot') => {
    document.addEventListener('copilot-publish', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const { projectId, demoId } = e.detail ?? {};
        console.log(`${type} publish p:${projectId} d:${demoId}`);
        
        if (uploadAsset) {
            uploadAsset();
        } else {
            console.error('uploadAsset function not available');
        }
    });
};

// Main initialization function
const initializeEditor = async (config) => {
    const { type, params, token, tokenName, prodParam } = config;
    
    console.log(`Initializing ${type}...`);
    
    // Determine environment
    const isProd = isProduction(params, prodParam);
    const envConfig = getEnvironmentConfig(isProd);
    
    // Authenticate
    await authenticateWithPilot(envConfig.pilot, token, tokenName);
    
    // Load upload asset function
    const uploadAsset = await loadUploadAsset(isProd);
    
    // Inject resources
    injectCSS(envConfig.editor);
    injectScript(envConfig.editor);
    
    // Setup publish handler
    setupPublishHandler(uploadAsset, type);
    
    console.log(`${type} initialization complete`);
};

// DOM ready handler
const setupDOMReadyHandler = (config) => {
    const handler = async () => {
        await initializeEditor(config);
    };
    
    document.addEventListener('DOMContentLoaded', handler, { once: true });
    
    // Backup initialization in case DOMContentLoaded already fired
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('DOM already loaded, initializing immediately...');
        document.dispatchEvent(new Event('DOMContentLoaded'));
    }
};

// Main execution
const urlParams = getUrlParams();
const shouldLoadCopilot = urlParams.has('copilotEditor') || urlParams.has('copilotPreview');

if (shouldLoadCopilot) {
    const imsToken = window.location.search.split("ims_token=")[1];
    
    setupDOMReadyHandler({
        type: 'New Copilot',
        params: urlParams,
        token: imsToken,
        tokenName: 'IMS',
        prodParam: 'copilot-prod'
    });
} else {
    console.log('Copilot not enabled. Add ?copilotEditor or ?copilotPreview to URL to enable.');
}

// ZDP (Zero Data Platform) initialization
const zdpUrlParams = getUrlParams();
const shouldLoadZDP = zdpUrlParams.has('zdp-id');

if (shouldLoadZDP) {
    const zdpToken = getParamWithFallback(zdpUrlParams, 'zdp-token', 'zdp-token');
    
    setupDOMReadyHandler({
        type: 'ZDP Pilot',
        params: zdpUrlParams,
        token: zdpToken,
        tokenName: 'ZDP',
        prodParam: 'zdp-env'
    });
}