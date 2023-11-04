function custom_replaceDate(inputString, file) {
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    let currentDay = currentDate.getDate().toString().padStart(2, '0');
    let currentTimestampMs = currentDate.getTime();
    let currentTimestamp = Math.floor(currentTimestampMs / 1000);
    let replacements = {
        '$date$': `${currentYear}年${currentMonth}月${currentDay}日`,
        '$date-yyyy$': currentYear,
        '$date-mm$': currentMonth,
        '$date-dd$': currentDay,
        '$date-time$': currentTimestampMs,
        '$date-Time$': currentTimestamp,
        '$fileName$': file.name,
        '$fileSize$': file.size,
        '$fileType$': file.type,
    };
    let replacedString = inputString;

    // 此正则表达式在循环之外创建
    const regex = new RegExp(Object.keys(replacements).map(escapeRegExp).join('|'), 'g');
    if (typeof replacedString == 'object' && file.name) {
        let OObj = []
        if (ProgramConfigurations.custom_Base64Upload) {
            OObj.push(file.dataURL) //返回b64
            return OObj[0];
        }
        OObj.push(file)
        return OObj[0];
    }
    if (typeof replacedString === 'string') {
        if (replacedString.includes('$file$')) {
            if (ProgramConfigurations.custom_Base64Upload) {
                return file.dataURL;
            }
            return file;
        }
        replacedString = replacedString.replace(regex, (match) => replacements[match]);
    }
    return replacedString;
}
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function custom_replaceDateInObject(obj, file) {
    let content = {};
    if (typeof obj === 'object') {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                content[key] = custom_replaceDate(obj[key], file);
            } else if (typeof obj[key] === 'object') {
                content[key] = custom_replaceDateInObject(obj[key], file);
            }
        }
    }
    return content;
}

/**
 * 扩展popup页上传函数
 */
function popup_Uploader() {
    let delay;
    let delayUpload; // 声明 delayUpload 变量
    switch (ProgramConfigurations.options_exe) {
        // 自定义上传属性
        case 'Lsky':
            uploader.options.url = ProgramConfigurations.options_proxy_server + "https://" + ProgramConfigurations.options_host + "/api/v1/upload";
            uploader.options.headers = { "Authorization": ProgramConfigurations.options_token };
            uploader.options.paramName = 'file';
            uploader.options.acceptedFiles = '.jpeg,.jpg,.png,.gif,.tif,.bmp,.ico,.psd,.webp';
            uploader.on("sending", function (file, xhr, formData) {
                if (ProgramConfigurations.options_source_select) {
                    formData.append("strategy_id", ProgramConfigurations.options_source_select);

                }
                if (ProgramConfigurations.options_album_id) {
                    formData.append("album_id", ProgramConfigurations.options_album_id);
                }
                formData.append("permission", ProgramConfigurations.options_permission_select);
            })
            break;
        case 'UserDiy':
            uploader.options.maxFilesize = 5000
            uploader.options.acceptedFiles = ""
            uploader.options.autoProcessQueue = false
            delayUpload = async function (file) {
                if (file.size > uploader.options.maxFilesize * 1024 * 1024) {
                    return;
                }
                if (ProgramConfigurations.custom_Base64Upload) {
                    const reader = new FileReader();
                    reader.onload = function () {
                        file.dataURL = ProgramConfigurations.custom_Base64UploadRemovePrefix ? btoa(reader.result) : reader.result;
                        completeReplaceOperations(file);
                    };

                    if (ProgramConfigurations.custom_Base64UploadRemovePrefix) {
                        reader.readAsBinaryString(file);
                    } else {
                        reader.readAsDataURL(file);
                    }
                } else {
                    completeReplaceOperations(file);
                }
                function completeReplaceOperations(file) {
                    let _apihost = custom_replaceDate(ProgramConfigurations.options_apihost, file);
                    let _Headers = custom_replaceDateInObject(ProgramConfigurations.options_Headers, file);
                    let _Body = custom_replaceDateInObject(ProgramConfigurations.options_Body, file);
                    let Body;
                    if (ProgramConfigurations.custom_BodyUpload == true) {
                        Body = {};
                        if (ProgramConfigurations.custom_BodyStringify == true) {
                            Body = JSON.stringify(_Body)
                        } else {
                            Body = _Body
                        }
                    } else {
                        Body = new FormData();
                        if (ProgramConfigurations.custom_Base64Upload == true) {
                            Body.append(ProgramConfigurations.options_parameter, file.dataURL);
                        } else {
                            Body.append(ProgramConfigurations.options_parameter, file)
                        }
                        if (_Body.length > 0) {
                            for (let key in _Body) {
                                Body.append(key, _Body[key])
                            }
                        }

                    }
                    $.ajax({
                        url: ProgramConfigurations.options_proxy_server + _apihost,
                        type: ProgramConfigurations.requestMethod,
                        headers: _Headers,
                        processData: false,  // 不对数据进行处理
                        contentType: false,  // 不设置内容类型
                        xhr: function () {
                            const xhr = new window.XMLHttpRequest();
                            xhr.upload.addEventListener("progress", function (evt) {
                                if (evt.lengthComputable) {
                                    const percentComplete = Math.floor((evt.loaded / evt.total) * 100);
                                    file.upload.progress = percentComplete;
                                    file.status = Dropzone.UPLOADING;
                                    uploader.emit("uploadprogress", file, percentComplete, 100);
                                }
                            }, false);

                            return xhr;
                        },
                        data: Body,
                        success: function (response) {
                            uploader.emit("success", file, response);
                            uploader.emit("complete", file, response);
                        },
                        error: function (xhr, status, error) {
                            if (xhr) {
                                uploader.emit("error", file, xhr);
                                return;
                            }
                        }
                    });
                }
            }
            uploader.on("addedfile", function (file) {
                delayUpload(file);
            });
            break;
    }
}

/**
 * 
 * @param {*} event 
 * @param {*} Simulated_upload 
 * @param {*} EditPasteUpload 
 * @returns 
 * 页面注入js 上传函数
 */
function content_scripts_CheckUploadModel(event, Simulated_upload, EditPasteUpload) {
    if (Simulated_upload == true) {
        let confirm_input = confirm(chrome.i18n.getMessage("Function_demonstration_12"))
        Simulated_upload = false //恢复上传
        confetti({
            particleCount: 200,
            angle: 60,
            spread: 55,
            origin: { x: 0 },

        });
        confetti({
            particleCount: 200,
            angle: 120,
            spread: 55,
            origin: { x: 1 },

        });
        if (confirm_input == true) {
            chrome.runtime.sendMessage({ Demonstration_middleware: "Drag_upload_100" });
        } else {
            iframeShow()
            chrome.runtime.sendMessage({ Demonstration_middleware: "closeIntro" });
        }
        return;
    }
    if (EditPasteUpload == true) {
        filesUP(event)
        return;
    }
    if (event.dataTransfer.types.includes('text/uri-list')) {
        // 拖拽的是网络资源（URL）
        let htmlData = event.dataTransfer.getData('text/html');
        // 解析HTML数据为DOM树
        let parser = new DOMParser();
        let doc = parser.parseFromString(htmlData, 'text/html');
        // 在DOM树中查找img标签并获取src属性
        let imgTags = doc.getElementsByTagName('img');
        if (imgTags.length > 0) {
            let src = imgTags[0].getAttribute('src');
            console.log('提取到img标签的src属性:', src);
            chrome.runtime.sendMessage({ Drag_Upload: src });
            doc = null; //释放资源

        }
    } else if (event.dataTransfer.types.includes('Files')) {
        // 拖拽的是本地资源（文件）
        let files = event.dataTransfer.files;
        if (files.length > 0) {
            filesUP(files)
        }

    }
    function filesUP(files) {
        chrome.storage.local.get(["ProgramConfiguration"], function (result) {
            ProgramConfigurations = result.ProgramConfiguration
            if (ProgramConfigurations.options_exe === "Tencent_COS" || ProgramConfigurations.options_exe === 'Aliyun_OSS' || ProgramConfigurations.options_exe === 'AWS_S3' || ProgramConfigurations.options_exe === 'GitHubUP' || ProgramConfigurations.options_exe === 'fiftyEight' || ProgramConfigurations.options_exe === 'UserDiy') {
                function processFile(fileIndex) {
                    if (fileIndex < files.length) {
                        let file = files[fileIndex];
                        if (ProgramConfigurations.options_exe == 'GitHubUP' || ProgramConfigurations.options_exe === 'fiftyEight') {
                            // 需要转码的
                            let reader = new FileReader();
                            reader.onload = function () {
                                content_scripts_HandleUploadWithMode({ btoa: btoa(reader.result), file: file }, "GlobalUpload", () => {
                                    setTimeout(function () {
                                        processFile(fileIndex + 1);
                                    }, 150);
                                }, Simulated_upload);
                            };
                            reader.readAsBinaryString(file);
                        } else {
                            //Tencent_COS,Aliyun_OSS,AWS_S3
                            content_scripts_HandleUploadWithMode(file, "GlobalUpload", () => {
                                setTimeout(function () {
                                    processFile(fileIndex + 1);
                                }, 150);
                            }, Simulated_upload);
                        }
                        console.log("文件推送成功");
                    }
                }
                processFile(0)
            } else {
                let base64Strings = [];
                for (let i = 0; i < files.length; i++) {
                    (function (file) {
                        let reader = new FileReader();
                        reader.onload = function () {
                            // 将二进制数据编码为base64字符串并存储在数组中
                            base64Strings.push(btoa(reader.result));
                            if (base64Strings.length == files.length) {
                                chrome.runtime.sendMessage({ GlobalUpload: base64Strings });
                            }
                            console.log("base64转码推送成功")
                        }
                        // 读取当前文件的内容
                        reader.readAsBinaryString(file);

                    })(files[i]);
                }
            }
        })
    }
}
/**
 * 
 * @param {string} imgUrl 
 * @param {string} MethodName 模式
 * @param {function} callback 回调
 * @param {Boole} Simulated_upload 模拟上传 
 * @ 函数用作处理特殊的上传方式
 */
function content_scripts_HandleUploadWithMode(imgUrl, MethodName, callback, Simulated_upload) {
    chrome.storage.local.get(null, function (result) {
        if (result.ProgramConfiguration) {
            const programConfig = result.ProgramConfiguration || {};
            for (const key in ProgramConfigurations) {
                if (programConfig.hasOwnProperty(key)) {
                    ProgramConfigurations[key] = programConfig[key];
                }
            }
        }
        // 初始化新安装时的判断跨域开关
        if (ProgramConfigurations.options_proxy_server_state == 0) {
            ProgramConfigurations.options_proxy_server = ""
        }
        if (!ProgramConfigurations.options_proxy_server) {
            ProgramConfigurations.options_proxy_server = ""
        }
        if (Simulated_upload == true) {
            Right_click_menu_animations()
            return;
        }
        if (typeof callback !== 'function') {
            callback = function () { };
        }
        if (MethodName == "GlobalUpload") {
            //处理拖拽上传的方法
            const uploadFunctions = {
                UserDiy: custom_uploadFile,
            };
            if (ProgramConfigurations.options_exe in uploadFunctions) {
                uploadFunctions[ProgramConfigurations.options_exe](imgUrl);
            };
        }
        if (MethodName == "Drag_Upload" || MethodName == "Right_Upload") {
            (async () => {
                try {
                    const res = await fetch(ProgramConfigurations.options_proxy_server + imgUrl);
                    const blob = await res.blob();
                    blobUP(blob, imgUrl)
                } catch (error) {
                    console.log("获取失败，再次尝试...");
                    try {
                        const res = await fetch("https://cors-anywhere.pnglog.com/" + imgUrl);
                        const blob = await res.blob();
                        blobUP(blob, imgUrl)
                    } catch (error) {
                        chrome.runtime.sendMessage({ Loudspeaker: chrome.i18n.getMessage("Upload_prompt4") });
                        console.log(error);
                        return;
                    }
                }
            })()
            function blobUP(blob, imgUrl) {
                if (ProgramConfigurations.options_exe == "UserDiy") {
                    custom_uploadFile(blob, imgUrl)
                }
              
            }
        }

        function custom_uploadFile(blob, imgUrl) {
            if (ProgramConfigurations.custom_KeywordReplacement) {
                ProgramConfigurations.Keyword_replacement1 = ProgramConfigurations.Keyword_replacement1.split(',')
                ProgramConfigurations.Keyword_replacement2 = ProgramConfigurations.Keyword_replacement2.split(',')
                if (ProgramConfigurations.Keyword_replacement1.length != ProgramConfigurations.Keyword_replacement2.length) {
                    alert("关键词和替换词的数量不一致");
                    PLNotification({
                        title: "盘络上传：",
                        type: "error",
                        content: `关键词和替换词的数量不一致!`,
                        duration: 0,
                        saved: true,
                    });
                    return;
                }
            }
            if (!ProgramConfigurations.options_Headers) {
                ProgramConfigurations.options_Headers = {}
            } else {
                try {
                    ProgramConfigurations.options_Headers = JSON.parse(ProgramConfigurations.options_Headers);
                } catch (error) {
                    alert(chrome.i18n.getMessage("Headers_error"));
                    PLNotification({
                        title: "盘络上传：",
                        type: "error",
                        content: chrome.i18n.getMessage("Headers_error"),
                        duration: 0,
                        saved: true,
                    });
                    return;
                }
            }
            if (!ProgramConfigurations.options_Body) {
                ProgramConfigurations.options_Body = {}
            } else {
                try {
                    ProgramConfigurations.options_Body = JSON.parse(ProgramConfigurations.options_Body);
                } catch (error) {
                    console.log(error);
                    alert(chrome.i18n.getMessage("Body_error"));
                    PLNotification({
                        title: "盘络上传：",
                        type: "error",
                        content: chrome.i18n.getMessage("Body_error"),
                        duration: 0,
                        saved: true,
                    });
                    return;
                }
            }
            let date = new Date();
            const imageExtension = getImageFileExtension(imgUrl, blob)
            let UrlImgNema = ProgramConfigurations.options_exe + `_` + MethodName + `_` + (Math.floor(date.getTime() / 1000)) + "." + imageExtension;
            let filename = UrlImgNema;
            chrome.runtime.sendMessage({ "Progress_bar": { "filename": filename, "status": 1 } });
            let file = new File([blob], UrlImgNema, { type: 'image/' + imageExtension });
            if (ProgramConfigurations.custom_Base64Upload) {
                const reader = new FileReader();
                reader.onload = function () {
                    file.dataURL = ProgramConfigurations.custom_Base64UploadRemovePrefix ? btoa(reader.result) : reader.result;
                    completeReplaceOperations(file);
                };

                if (ProgramConfigurations.custom_Base64UploadRemovePrefix) {
                    reader.readAsBinaryString(file);
                } else {
                    reader.readAsDataURL(file);
                }
            } else {
                completeReplaceOperations(file);
            }
            function completeReplaceOperations(file) {
                let _apihost = custom_replaceDate(ProgramConfigurations.options_apihost, file);
                let _Headers = custom_replaceDateInObject(ProgramConfigurations.options_Headers, file);
                let _Body = custom_replaceDateInObject(ProgramConfigurations.options_Body, file);
                let Body = {};
                if (ProgramConfigurations.custom_BodyUpload == true) {
                    if (ProgramConfigurations.custom_BodyStringify == true) {
                        Body = JSON.stringify(_Body)
                    } else {
                        Body = _Body
                    }
                } else {
                    Body = new FormData()
                    if (ProgramConfigurations.custom_Base64Upload == true) {
                        Body.append(ProgramConfigurations.options_parameter, file.dataURL);
                    } else {
                        Body.append(ProgramConfigurations.options_parameter, file)
                    }
                    if (_Body.length > 0) {
                        for (let key in _Body) {
                            Body.append(key, _Body[key])
                        }
                    }
                }
                fetch(ProgramConfigurations.options_proxy_server + _apihost, {
                    method: ProgramConfigurations.requestMethod,
                    headers: _Headers,
                    body: Body,
                })
                    .then(response => response.json())
                    .then(data => {
                        callback(data, null);
                        console.log(data);
                        let options_return_success_value = data;
                        ProgramConfigurations.options_return_success.split('.').forEach(function (prop) {
                            if (options_return_success_value) {
                                options_return_success_value = options_return_success_value[prop];
                            }
                        });
                        if (ProgramConfigurations.custom_ReturnPrefix) {
                            options_return_success_value = ProgramConfigurations.custom_ReturnPrefix + options_return_success_value
                        }
                        if (ProgramConfigurations.custom_ReturnAppend) {
                            options_return_success_value += ProgramConfigurations.custom_ReturnAppend
                        }
                        if (ProgramConfigurations.custom_KeywordReplacement) {
                            options_return_success_value = replaceKeywordsInText(options_return_success_value, ProgramConfigurations.Keyword_replacement1, ProgramConfigurations.Keyword_replacement2)
                        }
                        imageUrl = options_return_success_value

                        chrome.storage.local.get(["FuncDomain"], function (result) {
                            if (result.FuncDomain.AutoCopy == "on") {
                                window.postMessage({ type: 'AutoCopy', data: imageUrl }, '*');
                            }
                        });
                        ProgramConfigurations.options_host = _apihost
                        LocalStorage({
                            "file": {
                                "name": UrlImgNema,
                                "file": file,
                            },
                            "url": imageUrl,
                            "MethodName": MethodName,
                            "uploadDomainName": _apihost
                        })
                    }).catch(error => {
                        console.log(error)
                        callback(null, new Error(chrome.i18n.getMessage("Upload_prompt3")));
                        chrome.runtime.sendMessage({ Loudspeaker: chrome.i18n.getMessage("Upload_prompt4") });
                        chrome.runtime.sendMessage({ "Progress_bar": { "filename": UrlImgNema, "status": 0 } });
                        return;
                    })
            }
        }
    })
}
/**
 * 
 * @param {string} imgUrl 
 * @param {file} file 文件
 * @returns 返回处理后的后缀
 * @ 用作识别url后缀或file.type的后缀并返回他们
 */
function getImageFileExtension(imgUrl, file) {
    let extension;
    const validExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'svg', 'ico', 'apng', 'jng'];
    if (imgUrl) {
        const urlParts = imgUrl.split(".");
        if (urlParts.length > 1) {
            const fileType = urlParts.pop().toLowerCase();
            const extensions = fileType.split(";");
            const candidateExtension = extensions[0].split("/").pop();
            if (validExtensions.includes(candidateExtension)) {
                extension = candidateExtension;
                console.log("url:", extension);
            }
        }
    }
    if (!validExtensions.includes(extension) && file.type) {
        const fileTypeParts = file.type.split("/");
        if (fileTypeParts.length > 1) {
            extension = fileTypeParts.pop().toLowerCase();
            console.log("file:", extension);
        }
    } else {
        return "png"
    }

    return extension;
}

/**
 * @param {string} filename 文件名字 
 * @param {url} imageUrl 上传成功后的url
 * {
        "file": {
          "fileName": null,
          "file": file,
        },
        "url": url,
        "MethodName": "normal",
        "uploadDomainName": ProgramConfigurations.options_host
      }
 */
function LocalStorage(data) {

    let pluginPopup = chrome.runtime.getURL("popup.html");
    let currentURL = window.location.href;
    return new Promise((resolveC, rejectC) => {
        let filename = data.file.name || data.file.file.name;
        let imageUrl = data.url
        let MethodName = data.MethodName || "normal";
        let uploadDomainName = data.uploadDomainName || ProgramConfigurations.options_host;
        if (pluginPopup != currentURL) {
            chrome.runtime.sendMessage({ "Progress_bar": { "filename": filename, "status": 2 } });
        }
        chrome.storage.local.get('UploadLog', function (result) {
            UploadLog = result.UploadLog || [];
            if (!Array.isArray(UploadLog)) {
                UploadLog = [];
            }
            function generateRandomKey() {
                return new Promise(resolve => {
                    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
                    let key = '';
                    for (let i = 0; i < 6; i++) {
                        key += characters.charAt(Math.floor(Math.random() * characters.length));
                    }
                    // 确保不会重复
                    while (UploadLog.some(log => log.id === key)) {
                        key = '';
                        for (let i = 0; i < 6; i++) {
                            key += characters.charAt(Math.floor(Math.random() * characters.length));
                        }
                    }
                    resolve(key);
                });
            }
            generateRandomKey().then(key => {
                let d = new Date();
                let UploadLogData = {
                    key: key,
                    url: imageUrl,
                    uploadExe: ProgramConfigurations.options_exe + "-" + MethodName,
                    upload_domain_name: uploadDomainName,
                    original_file_name: filename,
                    file_size: data.file.file.size,
                    img_file_size: "宽:不支持,高:不支持",
                    uploadTime: d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日" + d.getHours() + "时" + d.getMinutes() + "分" + d.getSeconds() + "秒"
                }
                if (typeof UploadLog !== 'object') {
                    UploadLog = JSON.parse(UploadLog);
                }
                UploadLog.push(UploadLogData);
                chrome.storage.local.set({ 'UploadLog': UploadLog }, function () {
                    if (window.location.href.startsWith('http')) {
                        chrome.runtime.sendMessage({ Loudspeaker: chrome.i18n.getMessage("Upload_prompt2") });
                        AutoInsertFun(imageUrl, false)
                    }
                    resolveC(true);
                })
            });
        });
    });

}
