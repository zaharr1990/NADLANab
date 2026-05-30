// App State Management
const GEMINI_API_KEY = 'AIzaSyB4jTSL7T-lHGLT4Xs_3J6h7biEKZ9x1VA';

const State = {
    leads: [],
    properties: [],
    settings: {
        geminiKey: GEMINI_API_KEY,
        userName: 'בלה',
        agencyName: 'ABAYEV נדל"ן'
    },
    chats: {}, // { agentId: [{role: 'user'|'model', text: '...', timestamp: Date}] }
    activeView: 'dashboard',
    activeAgentId: 'sales'
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromLocalStorage();
    initNavigation();
    initEventListeners();
    renderAll();
    
    // Set up default chat if empty
    initDefaultChats();
});

// Load state from LocalStorage
function loadDataFromLocalStorage() {
    try {
        const storedLeads = localStorage.getItem('abayev_leads');
        const storedProps = localStorage.getItem('abayev_properties');
        const storedSettings = localStorage.getItem('abayev_settings');
        const storedChats = localStorage.getItem('abayev_chats');
        
        if (storedSettings) State.settings = { ...State.settings, ...JSON.parse(storedSettings) };
        State.settings.geminiKey = GEMINI_API_KEY;
        State.settings.userName = 'בלה';
        if (storedChats) State.chats = JSON.parse(storedChats);
        
        // Initialize Leads as empty array if not exists (No mock leads)
        if (storedLeads) {
            State.leads = JSON.parse(storedLeads);
        } else {
            State.leads = [];
            saveState('leads');
        }
        
        // Initialize Properties with Efrat's real catalog listings if not exists
        if (storedProps) {
            State.properties = JSON.parse(storedProps);
        } else {
            State.properties = [
                {
                    id: 'prop_real1',
                    address: 'דירת 2 חדרים (מחיר מציאה!), ירוחם',
                    price: '450000',
                    exclusivity: 'no',
                    exclExpiration: '',
                    ownerName: 'אפרת אבייב',
                    ownerPhone: '052-959-1089',
                    notes: '2 חדרים ממוזגת, משופצת חלקית, מושכרת ב-2,200 ש"ח לא כולל חשבונות. שטח בטאבו: 40 מ"ר, ארנונה: 48 מ"ר.',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'prop_real2',
                    address: 'שכונת האירוסים, ירוחם (2 חדרים)',
                    price: '425000',
                    exclusivity: 'no',
                    exclExpiration: '',
                    ownerName: 'אפרת אבייב',
                    ownerPhone: '052-959-1089',
                    notes: '2 חדרים משופצת, קומה 2, גודל בטאבו: 39.5 מ"ר. קרובה למרכז המסחרי. ריצוף חדש בכל הבית, צביעה קומפלט ותיקונים כלליים. 2 מזגנים במצב מעולה. שימו לב: מחיר סגירה!',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'prop_real3',
                    address: 'שכונת האירוסים (מחיר הזדמנות!), ירוחם',
                    price: '935000',
                    exclusivity: 'no',
                    exclExpiration: '',
                    ownerName: 'אפרת אבייב',
                    ownerPhone: '052-959-1089',
                    notes: 'דירת 4 חדרים מרווחת, 93 מ"ר, קומה 2, ממ"ד, מעלית, יחידת הורים, מרפסת שמש, שירותי אורחים.',
                    createdAt: new Date().toISOString()
                }
            ];
            saveState('properties');
        }
        
        // API key is hardcoded in the codebase
        const keyInput = document.getElementById('settings-gemini-key');
        if (keyInput) {
            keyInput.value = '••••••••••••••••••••••••••••••••';
        }
    } catch (e) {
        console.error("Error loading data from LocalStorage:", e);
        showToast("שגיאה בטעינת הנתונים המקומיים");
    }
}

// Save state to LocalStorage
function saveState(key) {
    try {
        if (key === 'leads' || !key) localStorage.setItem('abayev_leads', JSON.stringify(State.leads));
        if (key === 'properties' || !key) localStorage.setItem('abayev_properties', JSON.stringify(State.properties));
        if (key === 'settings' || !key) localStorage.setItem('abayev_settings', JSON.stringify(State.settings));
        if (key === 'chats' || !key) localStorage.setItem('abayev_chats', JSON.stringify(State.chats));
    } catch (e) {
        console.error("Error saving data to LocalStorage:", e);
        showToast("שגיאה בשמירת הנתונים");
    }
}

// Initialize Default Chat Messages
function initDefaultChats() {
    Object.keys(AGENTS_DATA).forEach(agentId => {
        if (!State.chats[agentId] || State.chats[agentId].length === 0) {
            State.chats[agentId] = [{
                role: 'model',
                text: AGENTS_DATA[agentId].initialMessage,
                timestamp: new Date().toISOString()
            }];
        }
    });
    saveState('chats');
}

// Navigation Handling
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            switchView(view);
        });
    });
    
    // Quick dashboard action buttons
    document.getElementById('dash-add-lead-btn').addEventListener('click', () => openModal('lead-modal'));
    document.getElementById('dash-add-prop-btn').addEventListener('click', () => openModal('prop-modal'));
    document.getElementById('dash-consult-btn').addEventListener('click', () => switchView('agents'));
    
    // Logo text click goes to dashboard
    document.querySelector('.logo-container').addEventListener('click', () => switchView('dashboard'));
    
    // Settings gear button click
    document.getElementById('settings-gear-btn').addEventListener('click', () => switchView('settings'));
}

function switchView(viewId) {
    if (!viewId) return;
    
    // Update active nav styling
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('data-view') === viewId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Show/hide views
    const views = document.querySelectorAll('.app-view');
    views.forEach(view => {
        if (view.id === `${viewId}-view`) {
            view.classList.add('active');
        } else {
            view.classList.remove('active');
        }
    });
    
    State.activeView = viewId;
    
    // Re-render target view
    if (viewId === 'dashboard') renderDashboard();
    if (viewId === 'leads') renderLeads();
    if (viewId === 'properties') renderProperties();
    if (viewId === 'agents') renderAgentsHub();
}

// Event Listeners for Modals and Forms
function initEventListeners() {
    // Lead Form Submit
    const leadForm = document.getElementById('lead-form');
    leadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveLead();
    });
    
    // Property Form Submit
    const propForm = document.getElementById('prop-form');
    propForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProperty();
    });
    
    // Settings Form Save
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const keyInput = document.getElementById('settings-gemini-key');
            if (keyInput) {
                const val = keyInput.value.trim();
                if (val && !val.includes('•••')) {
                    State.settings.geminiKey = val;
                }
            } else {
                State.settings.geminiKey = GEMINI_API_KEY;
            }
            saveState('settings');
            showToast("ההגדרות נשמרו בהצלחה!");
            switchView('dashboard');
        });
    }
    
    // Data backup button
    document.getElementById('backup-data-btn').addEventListener('click', exportBackupJSON);
    
    // Data restore trigger
    document.getElementById('restore-file-input').addEventListener('change', importBackupJSON);
    
    // Export leads to CSV
    document.getElementById('export-leads-csv-btn').addEventListener('click', exportLeadsToCSV);
    
    // Clear Database button
    document.getElementById('clear-db-btn').addEventListener('click', () => {
        if (confirm("האם את בטוחה שברצונך למחוק את כל הנתונים במערכת? פעולה זו אינה ניתנת לביטול!")) {
            localStorage.clear();
            State.leads = [];
            State.properties = [];
            State.chats = {};
            State.settings.geminiKey = '';
            initDefaultChats();
            saveState();
            showToast("המערכת אותחלה בהצלחה");
            renderAll();
            switchView('dashboard');
        }
    });
    
    // Chat Send button
    document.getElementById('chat-send-btn').addEventListener('click', handleSendMessage);
    document.getElementById('chat-input-text').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Leads search & filters
    document.getElementById('lead-search').addEventListener('input', renderLeads);
    document.getElementById('lead-filter-status').addEventListener('change', renderLeads);
    document.getElementById('lead-filter-type').addEventListener('change', renderLeads);
    
    // Property search & filters
    document.getElementById('prop-search').addEventListener('input', renderProperties);
    document.getElementById('prop-filter-excl').addEventListener('change', renderProperties);
}

// Modal actions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    if (modalId === 'lead-modal') {
        document.getElementById('lead-form').reset();
        document.getElementById('lead-id').value = '';
    }
    if (modalId === 'prop-modal') {
        document.getElementById('prop-form').reset();
        document.getElementById('prop-id').value = '';
    }
}

// Toast Notification
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// RENDER ALL VIEWS
function renderAll() {
    renderDashboard();
    renderLeads();
    renderProperties();
    renderAgentsHub();
}

// 1. Dashboard Renderer
function renderDashboard() {
    // Stats calculation
    const totalLeads = State.leads.length;
    const activeLeads = State.leads.filter(l => l.status !== 'closed').length;
    const totalProps = State.properties.length;
    const exclusivities = State.properties.filter(p => p.exclusivity === 'yes').length;
    
    document.getElementById('stat-active-leads').textContent = activeLeads;
    document.getElementById('stat-exclusivity').textContent = exclusivities;
    document.getElementById('stat-total-listings').textContent = totalProps;
    
    // Recent Leads List
    const recentLeadsList = document.getElementById('recent-leads-list');
    recentLeadsList.innerHTML = '';
    
    const sortedLeads = [...State.leads].slice(-3).reverse(); // Last 3 added
    
    if (sortedLeads.length === 0) {
        recentLeadsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-slash"></i>
                <p>אין לידים קרובים במערכת. לחצי על "הוספת ליד" למעלה!</p>
            </div>`;
    } else {
        sortedLeads.forEach(lead => {
            const card = document.createElement('div');
            card.className = `item-card glass-panel border-${lead.status}`;
            card.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${lead.name}</div>
                    <div class="item-subtext">${translateType(lead.type)} • ${lead.phone} • ${lead.requirements || 'ללא דרישות מיוחדות'}</div>
                </div>
                <span class="item-badge badge-${lead.status}">${translateStatus(lead.status)}</span>
            `;
            // Click to edit
            card.addEventListener('click', () => editLead(lead.id));
            recentLeadsList.appendChild(card);
        });
    }
    
    // Recent Listings List
    const recentPropsList = document.getElementById('recent-properties-list');
    recentPropsList.innerHTML = '';
    
    const sortedProps = [...State.properties].slice(-3).reverse();
    if (sortedProps.length === 0) {
        recentPropsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-home"></i>
                <p>אין נכסים במאגר כרגע. לחצי על "גיוס נכס חדש" למעלה!</p>
            </div>`;
    } else {
        sortedProps.forEach(prop => {
            const card = document.createElement('div');
            card.className = `item-card glass-panel ${prop.exclusivity === 'yes' ? 'gold-border-glow' : ''}`;
            card.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${prop.address}</div>
                    <div class="item-subtext">${prop.ownerName} • ₪${formatPrice(prop.price)}</div>
                </div>
                <span class="item-badge ${prop.exclusivity === 'yes' ? 'badge-closed' : 'badge-new'}">
                    ${prop.exclusivity === 'yes' ? 'בלעדיות' : 'רגיל'}
                </span>
            `;
            card.addEventListener('click', () => editProperty(prop.id));
            recentPropsList.appendChild(card);
        });
    }
}

// 2. Leads View Renderer
function renderLeads() {
    const searchVal = document.getElementById('lead-search').value.toLowerCase();
    const statusVal = document.getElementById('lead-filter-status').value;
    const typeVal = document.getElementById('lead-filter-type').value;
    
    const filteredLeads = State.leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchVal) || 
                              lead.phone.includes(searchVal) || 
                              (lead.requirements && lead.requirements.toLowerCase().includes(searchVal)) ||
                              (lead.notes && lead.notes.toLowerCase().includes(searchVal));
        const matchesStatus = statusVal === 'all' || lead.status === statusVal;
        const matchesType = typeVal === 'all' || lead.type === typeVal;
        
        return matchesSearch && matchesStatus && matchesType;
    }).reverse();
    
    const container = document.getElementById('leads-container-list');
    container.innerHTML = '';
    
    if (filteredLeads.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>לא נמצאו לידים התואמים את הסינון הנוכחי.</p>
            </div>`;
        return;
    }
    
    filteredLeads.forEach(lead => {
        const card = document.createElement('div');
        card.className = `item-card glass-panel border-${lead.status}`;
        card.style.flexDirection = 'column';
        card.style.alignItems = 'stretch';
        card.style.gap = '10px';
        card.style.marginBottom = '12px';
        
        // Lead header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.innerHTML = `
            <div>
                <div class="item-name" style="font-size: 15px; margin-bottom: 2px;">${lead.name}</div>
                <span class="item-badge badge-${lead.status}">${translateStatus(lead.status)}</span>
                <span class="item-badge badge-new" style="background: rgba(255,255,255,0.05); color: var(--text-secondary); margin-right: 5px;">
                    ${translateType(lead.type)}
                </span>
            </div>
            <div class="card-actions">
                <a href="tel:${lead.phone}" class="action-icon" title="התקשר קליק"><i class="fas fa-phone"></i></a>
                <a href="https://wa.me/972${lead.phone.replace(/^0/, '')}?text=${encodeURIComponent('שלום ' + lead.name + ', זו אפרת מנדל\'ן ABAYEV בקשר לפנייתך...')}" target="_blank" class="action-icon whatsapp" title="שלח וואטסאפ"><i class="fab fa-whatsapp"></i></a>
                <button class="action-icon" onclick="editLead('${lead.id}')" title="עריכה"><i class="fas fa-edit"></i></button>
                <button class="action-icon delete" onclick="deleteLead('${lead.id}')" title="מחיקה"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        
        // Lead details
        const details = document.createElement('div');
        details.style.fontSize = '12px';
        details.style.color = 'var(--text-secondary)';
        details.style.borderTop = '1px solid rgba(255,255,255,0.05)';
        details.style.paddingTop = '8px';
        
        let detailsHtml = `<div><strong>טלפון:</strong> ${lead.phone}</div>`;
        if (lead.budget) detailsHtml += `<div><strong>תקציב:</strong> ₪${formatPrice(lead.budget)}</div>`;
        if (lead.requirements) detailsHtml += `<div><strong>דרישות:</strong> ${lead.requirements}</div>`;
        if (lead.notes) detailsHtml += `<div style="margin-top: 4px; font-style: italic; color: var(--text-muted);">"${lead.notes}"</div>`;
        
        details.innerHTML = detailsHtml;
        
        // AI assist shortcuts
        const aiShortcuts = document.createElement('div');
        aiShortcuts.style.display = 'flex';
        aiShortcuts.style.gap = '6px';
        aiShortcuts.style.marginTop = '8px';
        aiShortcuts.innerHTML = `
            <button class="btn-secondary" style="font-size: 10px; padding: 4px 8px; border-color: rgba(251,191,36,0.3);" onclick="generateLeadMessage('${lead.id}')">
                <i class="fas fa-magic" style="color: var(--primary-gold); margin-left: 4px;"></i> מחולל הודעה לקונה
            </button>
            <button class="btn-secondary" style="font-size: 10px; padding: 4px 8px;" onclick="consultAboutLead('${lead.id}')">
                <i class="fas fa-comment-dots" style="color: var(--accent-indigo); margin-left: 4px;"></i> התייעצות לגבי הליד
            </button>
        `;
        
        card.appendChild(header);
        card.appendChild(details);
        card.appendChild(aiShortcuts);
        container.appendChild(card);
    });
}

// 3. Properties View Renderer
function renderProperties() {
    const searchVal = document.getElementById('prop-search').value.toLowerCase();
    const exclVal = document.getElementById('prop-filter-excl').value;
    
    const filteredProps = State.properties.filter(prop => {
        const matchesSearch = prop.address.toLowerCase().includes(searchVal) || 
                              prop.ownerName.toLowerCase().includes(searchVal) || 
                              prop.ownerPhone.includes(searchVal) || 
                              (prop.notes && prop.notes.toLowerCase().includes(searchVal));
        const matchesExcl = exclVal === 'all' || prop.exclusivity === exclVal;
        
        return matchesSearch && matchesExcl;
    }).reverse();
    
    const container = document.getElementById('properties-container-list');
    container.innerHTML = '';
    
    if (filteredProps.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>לא נמצאו נכסים התואמים את הסינון הנוכחי.</p>
            </div>`;
        return;
    }
    
    filteredProps.forEach(prop => {
        const isExcl = prop.exclusivity === 'yes';
        const card = document.createElement('div');
        card.className = `item-card glass-panel ${isExcl ? 'gold-border-glow' : ''}`;
        card.style.flexDirection = 'column';
        card.style.alignItems = 'stretch';
        card.style.gap = '10px';
        card.style.marginBottom = '12px';
        
        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.innerHTML = `
            <div>
                <div class="item-name" style="font-size: 15px; margin-bottom: 2px;">${prop.address}</div>
                <span class="item-badge ${isExcl ? 'badge-closed' : 'badge-new'}">
                    ${isExcl ? 'בלעדיות' : 'רגיל'}
                </span>
                ${prop.exclExpiration ? `<span class="item-subtext" style="margin-right: 8px; font-size: 10px;">עד: ${formatDate(prop.exclExpiration)}</span>` : ''}
            </div>
            <div class="card-actions">
                <a href="tel:${prop.ownerPhone}" class="action-icon" title="התקשר לבעלים"><i class="fas fa-phone"></i></a>
                <a href="https://wa.me/972${prop.ownerPhone.replace(/^0/, '')}?text=${encodeURIComponent('שלום ' + prop.ownerName + ', זו אפרת מנדל\'ן ABAYEV בקשר לנכס שלך ב-' + prop.address + '...')}" target="_blank" class="action-icon whatsapp" title="וואטסאפ לבעלים"><i class="fab fa-whatsapp"></i></a>
                <button class="action-icon" onclick="editProperty('${prop.id}')" title="עריכה"><i class="fas fa-edit"></i></button>
                <button class="action-icon delete" onclick="deleteProperty('${prop.id}')" title="מחיקה"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        
        // Details
        const details = document.createElement('div');
        details.style.fontSize = '12px';
        details.style.color = 'var(--text-secondary)';
        details.style.borderTop = '1px solid rgba(255,255,255,0.05)';
        details.style.paddingTop = '8px';
        
        let detailsHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                <div><strong>מחיר:</strong> ₪${formatPrice(prop.price)}</div>
                <div><strong>בעלים:</strong> ${prop.ownerName}</div>
            </div>`;
        if (prop.notes) detailsHtml += `<div style="margin-top: 6px; font-style: italic; color: var(--text-muted);">"${prop.notes}"</div>`;
        
        details.innerHTML = detailsHtml;
        
        // AI assist shortcuts
        const aiShortcuts = document.createElement('div');
        aiShortcuts.style.display = 'flex';
        aiShortcuts.style.gap = '6px';
        aiShortcuts.style.marginTop = '8px';
        aiShortcuts.innerHTML = `
            <button class="btn-secondary" style="font-size: 10px; padding: 4px 8px; border-color: rgba(251,191,36,0.3);" onclick="generatePropertyPitch('${prop.id}')">
                <i class="fas fa-handshake" style="color: var(--primary-gold); margin-left: 4px;"></i> הכנה לפגישת גיוס / שיחת שכנוע
            </button>
            <button class="btn-secondary" style="font-size: 10px; padding: 4px 8px;" onclick="generatePropertyPost('${prop.id}')">
                <i class="fas fa-bullhorn" style="color: var(--accent-indigo); margin-left: 4px;"></i> מחולל פוסט שיווקי
            </button>
        `;
        
        card.appendChild(header);
        card.appendChild(details);
        card.appendChild(aiShortcuts);
        container.appendChild(card);
    });
}

// 4. Agents Hub View Renderer
function renderAgentsHub() {
    const agentsGrid = document.getElementById('agents-selector-grid');
    agentsGrid.innerHTML = '';
    
    Object.keys(AGENTS_DATA).forEach(key => {
        const agent = AGENTS_DATA[key];
        const isActive = State.activeAgentId === key;
        
        const card = document.createElement('div');
        card.className = `agent-selector-card glass-panel ${agent.id} ${isActive ? 'active' : ''}`;
        card.innerHTML = `
            <div class="agent-avatar">${agent.avatar}</div>
            <div class="agent-name">${agent.name.split(' - ')[0]}</div>
            <div class="agent-desc">${agent.desc}</div>
        `;
        
        card.addEventListener('click', () => selectAgent(key));
        agentsGrid.appendChild(card);
    });
    
    // Render the chat for the active agent
    renderActiveChat();
}

function selectAgent(agentId) {
    State.activeAgentId = agentId;
    
    // Update active class on grid
    const cards = document.querySelectorAll('.agent-selector-card');
    cards.forEach(card => {
        if (card.classList.contains(agentId)) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    
    renderActiveChat();
}

function renderActiveChat() {
    const agent = AGENTS_DATA[State.activeAgentId];
    if (!agent) return;
    
    // Update active agent header
    document.getElementById('chat-agent-avatar').textContent = agent.avatar;
    document.getElementById('chat-agent-name').textContent = agent.name;
    document.getElementById('chat-agent-role').textContent = agent.role;
    
    // Render Messages
    const messagesContainer = document.getElementById('chat-messages-container');
    messagesContainer.innerHTML = '';
    
    const history = State.chats[State.activeAgentId] || [];
    history.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${msg.role === 'user' ? 'user' : 'agent'}`;
        // Support markdown-like linebreaks
        messageDiv.innerHTML = msg.text.replace(/\n/g, '<br>');
        messagesContainer.appendChild(messageDiv);
    });
    
    // Scroll to bottom
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);
    
    // Render Quick Prompt Helper Chips
    const promptChipsContainer = document.getElementById('prompt-helper-chips');
    promptChipsContainer.innerHTML = '';
    
    agent.prompts.forEach(p => {
        const chip = document.createElement('div');
        chip.className = 'prompt-helper-chip';
        chip.textContent = p.label;
        chip.addEventListener('click', () => {
            document.getElementById('chat-input-text').value = p.text;
            document.getElementById('chat-input-text').focus();
        });
        promptChipsContainer.appendChild(chip);
    });
}

// Send Message in Agent Chat
async function handleSendMessage() {
    const input = document.getElementById('chat-input-text');
    const userText = input.value.trim();
    if (!userText) return;
    
    const agentId = State.activeAgentId;
    
    // Clear Input
    input.value = '';
    
    // Add user message to state and DOM
    const userMsg = {
        role: 'user',
        text: userText,
        timestamp: new Date().toISOString()
    };
    State.chats[agentId].push(userMsg);
    saveState('chats');
    
    renderActiveChat();
    
    // Add Typing indicator
    const messagesContainer = document.getElementById('chat-messages-container');
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message-typing';
    typingIndicator.id = 'chat-typing-indicator';
    typingIndicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    try {
        let responseText = '';
        const apiKey = State.settings.geminiKey;
        
        if (apiKey) {
            // Live API query
            // Exclude system message and only send necessary history
            const history = State.chats[agentId].slice(1, -1); // Skip the very first bot welcome, and the current message which we append in the API call
            responseText = await queryGeminiAPI(apiKey, agentId, history, userText);
        } else {
            // Simulated Response with notification
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
            responseText = getSimulatedResponse(agentId, userText);
            
            // Show toast prompt reminder
            showToast("מצב הדמיה פעיל. הזיני מפתח API בהגדרות לחיבור חי.");
        }
        
        // Remove typing indicator
        const indicator = document.getElementById('chat-typing-indicator');
        if (indicator) indicator.remove();
        
        // Add response to state
        const agentMsg = {
            role: 'model',
            text: responseText,
            timestamp: new Date().toISOString()
        };
        State.chats[agentId].push(agentMsg);
        saveState('chats');
        
        renderActiveChat();
    } catch (error) {
        console.error(error);
        const indicator = document.getElementById('chat-typing-indicator');
        if (indicator) indicator.remove();
        
        // If API key failed, offer prompt copy helper
        const errorText = `שגיאת חיבור: ${error.message || 'לא ניתן לתקשר עם השרת'}.\n\n💡 באפשרותך להעתיק את הפרומפט המלא מוכן לשימוש ב-ChatGPT/Gemini המקורי שלך על ידי לחיצה על כפתור השיתוף או הפעלת המדמה.`;
        
        const agentMsg = {
            role: 'model',
            text: errorText,
            timestamp: new Date().toISOString()
        };
        State.chats[agentId].push(agentMsg);
        saveState('chats');
        renderActiveChat();
        
        // Offer Prompt Copy Button
        showPromptCopyDialog(agentId, userText);
    }
}

// Show Dialog with constructed prompt for copy-paste to external LLM
function showPromptCopyDialog(agentId, userText) {
    const agent = AGENTS_DATA[agentId];
    if (!agent) return;
    
    const fullPrompt = `${agent.systemPrompt}\n\nהנה הבקשה/השאלה שלי:\n${userText}`;
    
    document.getElementById('prompt-copy-text').value = fullPrompt;
    openModal('prompt-copy-modal');
}

function copyPromptText() {
    const textarea = document.getElementById('prompt-copy-text');
    textarea.select();
    document.execCommand('copy');
    showToast("הפרומפט הועתק ללוח! תוכלי להדביק אותו בכל צ'אט AI חיצוני.");
    closeModal('prompt-copy-modal');
}

// Lead Management Operations
function saveLead() {
    const id = document.getElementById('lead-id').value;
    const name = document.getElementById('lead-name').value.trim();
    const phone = document.getElementById('lead-phone').value.trim();
    const budget = document.getElementById('lead-budget').value.replace(/,/g, '').trim();
    const type = document.getElementById('lead-type').value;
    const requirements = document.getElementById('lead-req').value.trim();
    const status = document.getElementById('lead-status').value;
    const notes = document.getElementById('lead-notes').value.trim();
    
    if (!name || !phone) {
        showToast("שם וטלפון הם שדות חובה!");
        return;
    }
    
    if (id) {
        // Edit existing
        const index = State.leads.findIndex(l => l.id === id);
        if (index !== -1) {
            State.leads[index] = { ...State.leads[index], name, phone, budget, type, requirements, status, notes };
            showToast("הליד עודכן בהצלחה");
        }
    } else {
        // Create new
        const newLead = {
            id: 'lead_' + Date.now(),
            name, phone, budget, type, requirements, status, notes,
            createdAt: new Date().toISOString()
        };
        State.leads.push(newLead);
        showToast("ליד חדש נוסף בהצלחה");
    }
    
    saveState('leads');
    closeModal('lead-modal');
    renderAll();
}

function editLead(id) {
    const lead = State.leads.find(l => l.id === id);
    if (!lead) return;
    
    document.getElementById('lead-id').value = lead.id;
    document.getElementById('lead-name').value = lead.name;
    document.getElementById('lead-phone').value = lead.phone;
    document.getElementById('lead-budget').value = lead.budget || '';
    document.getElementById('lead-type').value = lead.type;
    document.getElementById('lead-req').value = lead.requirements || '';
    document.getElementById('lead-status').value = lead.status;
    document.getElementById('lead-notes').value = lead.notes || '';
    
    // Change modal title to Edit
    document.querySelector('#lead-modal .modal-title').textContent = 'עריכת פרטי ליד';
    openModal('lead-modal');
}

function deleteLead(id) {
    if (confirm("האם למחוק ליד זה מהמערכת?")) {
        State.leads = State.leads.filter(l => l.id !== id);
        saveState('leads');
        showToast("הליד נמחק בהצלחה");
        renderAll();
    }
}

// Property Operations
function saveProperty() {
    const id = document.getElementById('prop-id').value;
    const address = document.getElementById('prop-address').value.trim();
    const price = document.getElementById('prop-price').value.replace(/,/g, '').trim();
    const ownerName = document.getElementById('prop-owner-name').value.trim();
    const ownerPhone = document.getElementById('prop-owner-phone').value.trim();
    const exclusivity = document.getElementById('prop-excl').value;
    const exclExpiration = document.getElementById('prop-excl-exp').value;
    const notes = document.getElementById('prop-notes').value.trim();
    
    if (!address || !ownerName || !ownerPhone) {
        showToast("כתובת, שם בעלים וטלפון הם שדות חובה!");
        return;
    }
    
    if (id) {
        // Edit existing
        const index = State.properties.findIndex(p => p.id === id);
        if (index !== -1) {
            State.properties[index] = { ...State.properties[index], address, price, ownerName, ownerPhone, exclusivity, exclExpiration, notes };
            showToast("פרטי הנכס עודכנו");
        }
    } else {
        // Create new
        const newProp = {
            id: 'prop_' + Date.now(),
            address, price, ownerName, ownerPhone, exclusivity, exclExpiration, notes,
            createdAt: new Date().toISOString()
        };
        State.properties.push(newProp);
        showToast("נכס חדש נוסף למאגר");
    }
    
    saveState('properties');
    closeModal('prop-modal');
    renderAll();
}

function editProperty(id) {
    const prop = State.properties.find(p => p.id === id);
    if (!prop) return;
    
    document.getElementById('prop-id').value = prop.id;
    document.getElementById('prop-address').value = prop.address;
    document.getElementById('prop-price').value = prop.price || '';
    document.getElementById('prop-owner-name').value = prop.ownerName;
    document.getElementById('prop-owner-phone').value = prop.ownerPhone;
    document.getElementById('prop-excl').value = prop.exclusivity;
    document.getElementById('prop-excl-exp').value = prop.exclExpiration || '';
    document.getElementById('prop-notes').value = prop.notes || '';
    
    document.querySelector('#prop-modal .modal-title').textContent = 'עריכת פרטי נכס';
    openModal('prop-modal');
}

function deleteProperty(id) {
    if (confirm("האם למחוק נכס זה מהמערכת?")) {
        State.properties = State.properties.filter(p => p.id !== id);
        saveState('properties');
        showToast("הנכס נמחק");
        renderAll();
    }
}

// AI Assist functions from Lead Cards
function generateLeadMessage(leadId) {
    const lead = State.leads.find(l => l.id === leadId);
    if (!lead) return;
    
    switchView('agents');
    selectAgent('marketing');
    
    const customPrompt = `אני רוצה לשלוח הודעת וואטסאפ אישית לקונה הבא שלי. \nפרטי הקונה:\n- שם: ${lead.name}\n- תקציב: ₪${formatPrice(lead.budget) || 'לא מוגדר'}\n- דרישות: ${lead.requirements || 'דירה באזור'}\n\nתכתבי לי הודעה אישית, נעימה, קצרה ושיווקית שמציעה לו לתאם שיחת טלפון השבוע כדי לעבור על נכסים רלוונטיים שיש לי להציע לו.`;
    
    document.getElementById('chat-input-text').value = customPrompt;
    document.getElementById('chat-input-text').focus();
}

function consultAboutLead(leadId) {
    const lead = State.leads.find(l => l.id === leadId);
    if (!lead) return;
    
    switchView('agents');
    selectAgent('sales');
    
    const customPrompt = `אני צריכה להתייעץ לגבי הליד הבא:\n- שם: ${lead.name}\n- סטטוס נוכחי: ${translateStatus(lead.status)}\n- סוג: ${translateType(lead.type)}\n- דרישות/תקציב: ${lead.requirements || ''} (₪${formatPrice(lead.budget) || ''})\n- הערות עליו: ${lead.notes || 'אין'}\n\nתן לי אסטרטגיית פעולה מנצחת מולו. איזה שאלות לשאול אותו ואיך לקדם אותו לשלב הבא בבטחה?`;
    
    document.getElementById('chat-input-text').value = customPrompt;
    document.getElementById('chat-input-text').focus();
}

// AI Assist functions from Property Cards
function generatePropertyPitch(propId) {
    const prop = State.properties.find(p => p.id === propId);
    if (!prop) return;
    
    switchView('agents');
    selectAgent('objections');
    
    const customPrompt = `אני הולכת לפגישה עם בעל נכס ששמו ${prop.ownerName}. \nפרטי הנכס שלו:\n- כתובת: ${prop.address}\n- מחיר מבוקש: ₪${formatPrice(prop.price) || 'לא מוגדר'}\n- הערות/מצב הנכס: ${prop.notes || 'אין'}\n\nהוא כרגע מתלבט אם לתת לי בלעדיות לשיווק הנכס ומפחד להתחייב. תכין לי אסטרטגיית הכנה לפגישה, כולל טיעונים מנצחים ספציפית עבור הכתובת והבעלים הזה.`;
    
    document.getElementById('chat-input-text').value = customPrompt;
    document.getElementById('chat-input-text').focus();
}

function generatePropertyPost(propId) {
    const prop = State.properties.find(p => p.id === propId);
    if (!prop) return;
    
    switchView('agents');
    selectAgent('marketing');
    
    const customPrompt = `כתבי לי פוסט שיווקי מרהיב לפייסבוק עבור הנכס הבא:\n- כתובת: ${prop.address}\n- מחיר מבוקש: ₪${formatPrice(prop.price) || ''}\n- תיאור/הערות: ${prop.notes || ''}\n\nתעשי שימוש באימוג'ים מתאימים, תבליטי יתרונות ותגרמי לפוסט להיראות יוקרתי ומזמין במיוחד!`;
    
    document.getElementById('chat-input-text').value = customPrompt;
    document.getElementById('chat-input-text').focus();
}

// Backup & Import Utilities
function exportBackupJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(State));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `abayev_broker_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("הגיבוי הורד בהצלחה כקובץ JSON");
}

function importBackupJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedState = JSON.parse(e.target.result);
            if (importedState.leads || importedState.properties) {
                if (importedState.leads) State.leads = importedState.leads;
                if (importedState.properties) State.properties = importedState.properties;
                if (importedState.settings) State.settings = { ...State.settings, ...importedState.settings };
                if (importedState.chats) State.chats = importedState.chats;
                
                saveState();
                renderAll();
                showToast("הנתונים יובאו ושוחזרו בהצלחה!");
                
                // Reset file input
                event.target.value = '';
            } else {
                showToast("מבנה קובץ הגיבוי אינו תקין!");
            }
        } catch (err) {
            console.error(err);
            showToast("שגיאה בפענוח קובץ הגיבוי");
        }
    };
    reader.readAsText(file);
}

function exportLeadsToCSV() {
    if (State.leads.length === 0) {
        showToast("אין לידים לייצוא כרגע");
        return;
    }
    
    // CSV Header (with BOM for Excel Hebrew support)
    let csvContent = "\uFEFF"; 
    csvContent += "מזהה,שם,טלפון,תקציב,סוג ליד,דרישות,סטטוס,הערות,תאריך יצירה\n";
    
    State.leads.forEach(lead => {
        const row = [
            lead.id,
            `"${lead.name.replace(/"/g, '""')}"`,
            `"${lead.phone}"`,
            lead.budget || '',
            `"${translateType(lead.type)}"`,
            `"${(lead.requirements || '').replace(/"/g, '""')}"`,
            `"${translateStatus(lead.status)}"`,
            `"${(lead.notes || '').replace(/"/g, '""')}"`,
            lead.createdAt || ''
        ];
        csvContent += row.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `abayev_leads_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("ייצוא לידים לאקסל בוצע בהצלחה!");
}

// Translate helpers
function translateStatus(status) {
    const mapping = {
        'new': 'חדש',
        'contacted': 'יצרנו קשר',
        'meeting': 'פגישה',
        'negotiation': 'משא ומתן',
        'closed': 'סגור/נמכר'
    };
    return mapping[status] || status;
}

function translateType(type) {
    const mapping = {
        'buyer': 'קונה',
        'seller': 'מוכר',
        'tenant': 'שוכר',
        'landlord': 'משכיר'
    };
    return mapping[type] || type;
}

// Formatting helpers
function formatPrice(price) {
    if (!price) return '';
    return Number(price).toLocaleString('he-IL');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL');
}
