let StickerOptional;
function EmoticonBox() {
    let EmoticonBox = document.createElement('div');
    const maxZIndex = Math.pow(2, 31) - 1; //设置index
    EmoticonBox.style.zIndex = maxZIndex.toString() - 1;
    EmoticonBox.className = 'PL-EmoticonBox';
    EmoticonBox.style.display = "none"
    if (!document.getElementsByClassName("PL-EmoticonBox").length) {
        EmoticonBox.innerHTML = `
        <div class="StickerBox">
            <div class="StickerHead">
                <div class="StickerBoxhead">
                </div>
            </div>
            <div class="StickerBoxContent">
                <div class="PL-loading"></div>
            </div>
            <span class="StickerBoxRemove">X</span>
            <span class="StickerBoxLeftBut">👈</span>
            <div class="StickerBoxLeft">
                <p><input type="checkbox" id="StickerOptional">焦点插入</p>
                <select name="HTML" id="StickerCodeSelect">
                    <option value="URL">URL</option>
                    <option value="HTML">HTML</option>
                    <option value="BBCode">BBCode</option>
                    <option value="Markdown">Markdown</option>
                    <option value="MD with link">MD with link</option>
                </select>
            </div>
            <div class="StickerBoxright">
                <img src="${chrome.runtime.getURL("icons/logo128.png")}" id="PL-EmotionPreview">
            </div>
        </div>
        `
        document.body.appendChild(EmoticonBox);

        chrome.storage.local.get(['StickerOptional'], function (result) {
            document.getElementById("StickerOptional").checked = result.StickerOptional
            StickerOptional = result.StickerOptional
        });
        document.getElementById("StickerOptional").addEventListener('click', function (event) {
            const isChecked = event.target.checked;
            if (isChecked) {
                chrome.storage.local.set({ 'StickerOptional': 1 });

            } else {
                // 存储为0
                chrome.storage.local.set({ 'StickerOptional': 0 });
            }
            StickerOptional = isChecked
        });

        chrome.storage.local.get(['StickerCodeSelect'], function (result) {
            const selectedValue = result.StickerCodeSelect;
            const StickerCodeSelect = document.getElementById("StickerCodeSelect");
            if (selectedValue) {
                StickerCodeSelect.value = selectedValue;
            }
        });
        document.getElementById("StickerCodeSelect").addEventListener('change', function (event) {
            const selectedValue = this.value
            chrome.storage.local.set({ "StickerCodeSelect": selectedValue });
        });
        let StickerBoxLeftBut = 0
        document.querySelector(".StickerBoxLeftBut").addEventListener('click', function (event) {
            if (StickerBoxLeftBut == 0) {
                this.innerText = '👉'
                document.querySelector(".StickerBoxLeft").style.display = 'flex';
                StickerBoxLeftBut = 1
            } else {
                this.innerText = '👈'
                document.querySelector(".StickerBoxLeft").style.display = 'none';
                StickerBoxLeftBut = 0
            }

        });

        // 添加拖动逻辑
        let isDragging = false;
        let offsetX, offsetY;

        document.querySelector(".StickerBoxContent").addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);

        function startDrag(event) {
            if (event.target.tagName.toLowerCase() === 'img') {
                return; // 如果拖动的是 <img> 元素，不进行拖动处理
            }
            isDragging = true;
            offsetX = event.clientX - EmoticonBox.offsetLeft;
            offsetY = event.clientY - EmoticonBox.offsetTop;
        }

        function drag(event) {
            if (isDragging) {
                const x = event.clientX - offsetX;
                const y = event.clientY - offsetY;
                EmoticonBox.style.left = x + 'px';
                EmoticonBox.style.top = y + 'px';
            }
        }

        function stopDrag() {
            isDragging = false;
        }



        function makeHorizontalDraggable(element) {
            let isDragging = false;
            let startPosX = 0;
            let startScrollLeft = 0;

            element.addEventListener('mousedown', (e) => {
                isDragging = true;
                startPosX = e.clientX;
                startScrollLeft = element.scrollLeft;
                element.style.cursor = 'grabbing';
                e.preventDefault(); // 防止选中文字
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;

                const deltaX = e.clientX - startPosX;
                element.scrollLeft = startScrollLeft - deltaX;
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
                element.style.cursor = 'grab';
            });
        }
        makeHorizontalDraggable(document.querySelector('.StickerBoxhead'));
    }
}
EmoticonBox()
function mainLogic(insertContentPrompt) {
    const emoticonBox = document.querySelector('.PL-EmoticonBox');
    let timerShow;
    let timerHide;
    let getStickerStatus = false;
    let isShow = false;
    insertContentPrompt.addEventListener('mouseenter', () => {
        clearTimeout(timerHide); // 鼠标进入时清除隐藏的定时器
        if (isShow) return; //防止重复触发
        timerShow = setTimeout(() => {
            showEmoticonBox();
        }, 800);
    });
    insertContentPrompt.addEventListener('mouseleave', () => {
        clearTimeout(timerShow); // 鼠标离开时清除显示的定时器
        timerHide = setTimeout(() => {
            hideEmoticonBox();
        }, 1000); // 一秒后隐藏
    });

    emoticonBox.addEventListener('mouseenter', () => {
        clearTimeout(timerHide); // 鼠标进入 emoticonBox 时清除隐藏的定时器
    });

    emoticonBox.addEventListener('mouseleave', () => {
        timerHide = setTimeout(() => {
            hideEmoticonBox();
        }, 2000); // 一秒后隐藏
    });

    function showEmoticonBox() {
        isShow = true;
        clearTimeout(timerHide);
        const promptRect = insertContentPrompt.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset; //滚动条位置
        const scrollX = window.scrollX || window.pageXOffset; //滚动条位置

        const emoticonBoxWidth = 420  //贴纸盒子的宽度
        const emoticonBoxHeight = 200  //贴纸盒子的高度

        const viewportWidth = window.innerWidth;// 获取视口的可见宽
        const viewportHeight = window.innerHeight;// 获取视口的可见高度

        const spaceBelow = (scrollY + viewportHeight) - (scrollY + promptRect.bottom)

        const LeftRightPositions = scrollX + promptRect.left
        if (LeftRightPositions >= emoticonBoxWidth) {
            emoticonBox.style.left = `${promptRect.right - emoticonBoxWidth + 12}px`;

        } else {
            emoticonBox.style.left = `${promptRect.left}px`;
        }

        if (spaceBelow >= emoticonBoxHeight) {
            // 下方空间足够，显示在下方
            emoticonBox.style.top = `${promptRect.bottom + scrollY + 10}px`;
        } else {
            emoticonBox.style.top = `${promptRect.top + scrollY - emoticonBoxHeight - 10}px`;
        }
        emoticonBox.style.display = 'block';

        dbHelper("Sticker").then(function (result) {
            const { db } = result;
            db.getAll().then(Sticker => {
                chrome.storage.local.get(["StickerHeadSelected"], function (result) {
                    emoticonBox.style.width = "420px";
                    let StickerDATA = Sticker || []
                    let StickerHeadSelected = result.StickerHeadSelected || 0
                    if (getStickerStatus == true) {
                        getSticker(1, db)
                        return;
                    }
                    if (StickerDATA.length == 0) {
                        //首次加载贴纸
                        getSticker(0, db)
                    } else {
                        //存储里的贴纸
                        DataRendering(StickerDATA, StickerHeadSelected, db)
                    }
                })
            })

        });
    }

    // 隐藏贴纸框
    function hideEmoticonBox() {
        isShow = false;
        emoticonBox.style.width = "0px";
        setTimeout(() => {
            emoticonBox.style.display = 'none';
        }, 500)
    }
    document.querySelector(".StickerBox .StickerBoxRemove").addEventListener('click', function (event) {
        hideEmoticonBox()
    })

    // 获取网络贴纸
    function getSticker(IsGet, db) {
        chrome.storage.local.get(["StickerURL"], function (result) {
            fetch('https://cors-anywhere.pnglog.com/' + result.StickerURL)
                .then(response => {
                    return response.json(); // 解析JSON数据
                })
                .then(data => {
                    if (data.sticker) {
                        data.sticker.forEach((item, index) => {
                            if (item.id === undefined) {
                                item.id = index;
                            }
                            if (item.index === undefined) {
                                item.index = item.id || index;
                            }
                        });
                        db.put(data.sticker).catch(error => {
                            console.log(error);
                        });
                        if (IsGet == 1) {
                            return;
                        }
                        DataRendering(data.sticker, 0)
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        })
    }

    // 贴纸渲染
    function DataRendering(data, StickerHeadSelected) {
        const StickerBoxhead = document.querySelector('.StickerBoxhead'); // 获取贴纸标题元素
        const StickerBoxContent = document.querySelector('.StickerBoxContent'); // 获取贴纸内容元素
        StickerBoxContent.innerHTML = '';
        let currentPage = 1;
        const itemsPerPage = 20;
        let Selected = StickerHeadSelected
        function updateSelectedStatus(selectedIndex) {
            const selectedItems = document.querySelectorAll('.StickerBoxheadtem');
            selectedItems.forEach((item, index) => {
                item.style.color = index === selectedIndex ? "red" : "#fff";
            });
        }

        data.forEach(function (sticker, index) {
            const StickerBoxheadtem = document.createElement('div');
            StickerBoxheadtem.className = 'StickerBoxheadtem';
            StickerBoxheadtem.textContent = sticker.StickerTitle;
            StickerBoxheadtem.title = sticker.StickerAuthor;
            StickerBoxhead.appendChild(StickerBoxheadtem);
            StickerBoxheadtem.addEventListener('click', function (event) {
                StickerBoxContent.innerHTML = '';
                currentPage = 1;
                Selected = index
                updateSelectedStatus(index);
                StickerDataItem(index);
                chrome.storage.local.set({ 'StickerHeadSelected': index })
            })
        })
        function StickerDataItem(index) {
            if (data[index].StickerData.length == 0) {
                StickerBoxContent.innerHTML = '数据为空';
                return;
            }
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;

            const EmotionPreview = document.getElementById('PL-EmotionPreview')
            const stickersToDisplay = data[index].StickerData.slice(startIndex, endIndex);

            // 贴纸遍历
            stickersToDisplay.forEach((sticker, stickerIndex) => {
                const StickerBoxContentitem = document.createElement('div');
                StickerBoxContentitem.className = 'StickerBoxContentitem';
                const img = document.createElement('img');
                img.src = sticker.StickerURL;
                img.alt = sticker.StickerName;
                img.title = sticker.StickerName;
                img.loading = "lazy";
                img.addEventListener('click', function (event) {
                    if (StickerOptional == 1) {
                        chrome.storage.local.get(['StickerCodeSelect'], function (result) {
                            const selectedValue = result.StickerCodeSelect;
                            let url;
                            switch (selectedValue) {
                                case 'URL':
                                    url = sticker.StickerURL
                                    break;
                                case 'HTML':
                                    url = '<img src="' + sticker.StickerURL + '" alt="" title="' + sticker.StickerName + '" >'
                                    break;
                                case 'BBCode':
                                    url = '[img]' + sticker.StickerURL + '[/img]'
                                    break;
                                case 'Markdown':
                                    url = '![' + sticker.StickerName + '](' + sticker.StickerURL + ')'
                                    break;
                                case 'MD with link':
                                    url = '[![' + sticker.StickerName + '](' + sticker.StickerURL + ')](' + sticker.StickerURL + ')'
                                    break;
                            }
                            AutoInsertFun(url, true);
                            return;
                        });
                    }
                    AutoInsertFun(sticker.StickerURL, false)
                })
                img.addEventListener('mouseover', function () {
                    EmotionPreview.style.display = "block"
                    EmotionPreview.src = this.src;
                });
                img.addEventListener('mouseleave', function () {
                    EmotionPreview.style.display = "none"
                });
                StickerBoxContentitem.appendChild(img);
                StickerBoxContent.appendChild(StickerBoxContentitem);
                if (stickerIndex === stickersToDisplay.length - 1) {
                    img.parentNode.classList.add('lastSticker');
                }
            });


            // 视口懒加载
            function handleIntersection(entries, observer) {
                let foundLastSticker = false;
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        try {
                            document.querySelector('.lastSticker').classList.remove('lastSticker');
                            currentPage++;
                            StickerDataItem(Selected);
                            foundLastSticker = true;
                        } catch (error) {
                            return;
                        }
                    }
                });
                // 如果没有找到 .lastSticker 元素，取消监听
                if (foundLastSticker) {
                    observer.disconnect();
                }
            }
            const observer = new IntersectionObserver(handleIntersection);
            setTimeout(() => {
                const elementsWithLastStickerClass = document.querySelectorAll('.lastSticker');
                elementsWithLastStickerClass.forEach(element => {
                    observer.observe(element);
                });
            }, 500);

        }
        updateSelectedStatus(Selected);
        StickerDataItem(Selected);
        getStickerStatus = true
    }
}

