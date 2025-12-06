document.addEventListener('DOMContentLoaded', () => {
    const el = {
        passiveBadge: document.getElementById('passive-badge'),
        passiveList: document.getElementById('passive-list'),
        btnFinger: document.getElementById('btnFingerprint'),
        fingerResult: document.getElementById('fingerprint-result'),
        activeList: document.getElementById('active-list'),
        btnExploit: document.getElementById('btnExploit'),
        cmdInput: document.getElementById('cmdInput'),
        exploitStatus: document.getElementById('exploit-status'),
        exploitResult: document.getElementById('exploit-result'),
        rceOutput: document.getElementById('rce-output'),
        // 内存马注入相关元素
        btnMemshell: document.getElementById('btnMemshell'),
        memshellStatus: document.getElementById('memshell-status'),
        memshellResult: document.getElementById('memshell-result'),
        memshellOutput: document.getElementById('memshell-output'),
        // 内存马命令执行相关元素
        btnMemshellCmd: document.getElementById('btnMemshellCmd'),
        memshellCmdInput: document.getElementById('memshellCmdInput'),
        memshellCmdStatus: document.getElementById('memshell-cmd-status'),
        memshellCmdResult: document.getElementById('memshell-cmd-result'),
        memshellCmdOutput: document.getElementById('memshell-cmd-output')
    };

    // 1. 获取当前 Tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const tabId = tabs[0].id;
        
        // --- 初始化：被动扫描 ---
        chrome.tabs.sendMessage(tabId, {action: "get_passive"}, (res) => {
            if(chrome.runtime.lastError || !res) {
                el.passiveBadge.innerText = "ERROR";
                el.passiveList.innerHTML = "<li>Please refresh page</li>";
                return;
            }
            if(res.isRSC) {
                el.passiveBadge.innerText = "DETECTED";
                el.passiveBadge.className = "badge red";
            } else {
                el.passiveBadge.innerText = "SAFE";
                el.passiveBadge.className = "badge green";
            }
            
            el.passiveList.innerHTML = "";
            if(res.details.length === 0) el.passiveList.innerHTML = "<li>No patterns found</li>";
            res.details.forEach(d => {
                const li = document.createElement('li');
                li.innerText = d;
                li.style.color = "#c0392b";
                el.passiveList.appendChild(li);
            });
        });

        // --- 交互：主动指纹 ---
        el.btnFinger.addEventListener('click', () => {
            el.btnFinger.disabled = true;
            el.btnFinger.innerText = "Probing...";
            el.fingerResult.style.display = 'none';

            chrome.tabs.sendMessage(tabId, {action: "run_fingerprint"}, (res) => {
                el.btnFinger.disabled = false;
                el.btnFinger.innerText = "Start Fingerprint Probe";
                el.fingerResult.style.display = 'block';
                el.activeList.innerHTML = "";

                if(res && res.detected) {
                    res.details.forEach(d => {
                        const li = document.createElement('li');
                        li.innerText = d;
                        li.style.color = "#d35400";
                        li.style.fontWeight = "bold";
                        el.activeList.appendChild(li);
                    });
                } else {
                    el.activeList.innerHTML = "<li style='color:#27ae60'>No Active RSC Response</li>";
                }
            });
        });

        // --- 交互：RCE 利用 ---
        el.btnExploit.addEventListener('click', () => {
            const cmd = el.cmdInput.value || "whoami";
            el.btnExploit.disabled = true;
            el.exploitStatus.style.display = 'block';
            el.exploitResult.style.display = 'none';
            el.rceOutput.className = 'console-out'; // 重置样式

            chrome.tabs.sendMessage(tabId, {action: "run_exploit", cmd: cmd}, (res) => {
                el.btnExploit.disabled = false;
                el.exploitStatus.style.display = 'none';
                el.exploitResult.style.display = 'block';

                if(res && res.success) {
                    el.rceOutput.style.color = "#00cec9"; // 青色成功色
                    el.rceOutput.innerText = `[+] Command: ${cmd}\n[+] Output:\n${res.output}`;
                    // 成功后强制图标报警
                    chrome.runtime.sendMessage({ action: "update_badge" });
                } else {
                    el.rceOutput.style.color = "#e74c3c"; // 红色失败色
                    el.rceOutput.innerText = `[-] ${res ? res.msg : "Unknown Error"}`;
                }
            });
        });

        // --- 交互：内存马注入 ---
        el.btnMemshell.addEventListener('click', () => {
            el.btnMemshell.disabled = true;
            el.btnMemshell.innerText = "Injecting...";
            el.memshellStatus.style.display = 'block';
            el.memshellResult.style.display = 'none';

            chrome.tabs.sendMessage(tabId, {action: "run_memshell"}, (res) => {
                el.btnMemshell.disabled = false;
                el.btnMemshell.innerText = "💉 Inject Memory Shell";
                el.memshellStatus.style.display = 'none';
                el.memshellResult.style.display = 'block';

                if(res && res.success) {
                    el.memshellOutput.style.color = "#9b59b6"; // 紫色成功色
                    el.memshellOutput.innerText = `[+] ${res.msg}\n[+] Path: ${res.path}`;
                    // 成功后强制图标报警
                    chrome.runtime.sendMessage({ action: "update_badge" });
                } else {
                    el.memshellOutput.style.color = "#e74c3c"; // 红色失败色
                    el.memshellOutput.innerText = `[-] ${res ? res.msg : "Unknown Error"}`;
                }
            });
        });

        // --- 交互：内存马命令执行 (/deep) ---
        el.btnMemshellCmd.addEventListener('click', () => {
            const cmd = el.memshellCmdInput.value || "whoami";
            el.btnMemshellCmd.disabled = true;
            el.memshellCmdStatus.style.display = 'block';
            el.memshellCmdResult.style.display = 'none';

            chrome.tabs.sendMessage(tabId, {action: "run_memshell_cmd", cmd: cmd}, (res) => {
                el.btnMemshellCmd.disabled = false;
                el.memshellCmdStatus.style.display = 'none';
                el.memshellCmdResult.style.display = 'block';

                if(res && res.success) {
                    el.memshellCmdOutput.style.color = "#8e44ad"; // 深紫色成功色
                    let output = `[+] Command: ${cmd}\n[+] Output:\n${res.output}`;
                    if(res.stderr) {
                        output += `\n[!] Stderr:\n${res.stderr}`;
                    }
                    el.memshellCmdOutput.innerText = output;
                    // 成功后强制图标报警
                    chrome.runtime.sendMessage({ action: "update_badge" });
                } else {
                    el.memshellCmdOutput.style.color = "#e74c3c"; // 红色失败色
                    el.memshellCmdOutput.innerText = `[-] ${res ? res.msg : "Unknown Error (Memshell not injected?)"}`;
                }
            });
        });
    });
});