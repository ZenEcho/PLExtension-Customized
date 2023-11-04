$(document).ready(function () {
    chrome.storage.local.get(storagelocal, function (result) {
        if (result.ProgramConfiguration) {
            const programConfig = result.ProgramConfiguration || {};
            for (const key in ProgramConfigurations) {
                if (programConfig.hasOwnProperty(key)) {
                    ProgramConfigurations[key] = programConfig[key];
                }
            }
        }

        Browse_mode_switching_status = result.Browse_mode_switching_status
        Copy_Selected_Mode = result.Copy_Selected_Mode
        let ImageProxy = result.FuncDomain.ImageProxy || 0

        let images
        let imageUrlkey = [] //必须在这里初始化
        let GitHubUP_file = []; //必须在这里初始化
        let $container
        let currentPage
        let itemsPerPage
        let totalPages;

        const Image_acquisition_failed = `
        <div class="alert alert-danger" role="alert">
            <h4 class="alert-heading">`+ chrome.i18n.getMessage("Kissing_alert") + `</h4>
            <p>`+ chrome.i18n.getMessage("Kissing_alert_p_1") + `</p>
            <hr>
            <p class="mb-0"><a class="nav-link" href="options.html">`+ chrome.i18n.getMessage("Kissing_alert_p2_2") + `</a></p>
        </div>`

        const No_picture_data = `
        <div class="alert alert-success" role="alert">
            <h4 class="alert-heading">`+ chrome.i18n.getMessage("Kissing_alert") + `</h4>
            <p>`+ chrome.i18n.getMessage("Kissing_alert_p_3") + `</p>
            <hr>
            <p class="mb-0">`+ chrome.i18n.getMessage("Kissing_alert_p2_4") + `</p>
        </div>`
        // 判断浏览模式开关
        if (!Browse_mode_switching_status) {
            chrome.storage.local.set({ 'Browse_mode_switching_status': 0 })
            Browse_mode_switching_status = 0
        }
        if (Browse_mode_switching_status == 1) {
            // 开启
            $("#Browse_mode_switch_button").attr('data-bs-content', chrome.i18n.getMessage("Browse_mode_switch_button_1_attr"))
            $("#Browse_mode_switch_button").html(`<i class="bi bi-circle-half"></i>` + chrome.i18n.getMessage("Browse_mode_switch_button_1"))
            $("#Browse_mode_switch_button").removeClass("css-button-rounded--black");
            $("#Browse_mode_switch_button").addClass('css-button-rounded--red');
        } else {
            $("#Browse_mode_switch_button").attr('data-bs-content', chrome.i18n.getMessage("Browse_mode_switch_button_0_attr"))
            $("#Browse_mode_switch_button").html(`<i class="bi bi-circle-half"></i>` + chrome.i18n.getMessage("Browse_mode_switch_button_0"))
            $("#Browse_mode_switch_button").removeClass("css-button-rounded--red")
            $("#Browse_mode_switch_button").addClass('css-button-rounded--black');
        }
        const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
        const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
        // 判断跨域开关
        if (ProgramConfigurations.options_proxy_server_state == 0) {
            ProgramConfigurations.options_proxy_server = ""
        }

        if (!ProgramConfigurations.options_proxy_server) {
            ProgramConfigurations.options_proxy_server = ""
        }
        // 判断复制模式
        if (!Copy_Selected_Mode) {
            Copy_Selected_Mode = "URL"
        }
        let Sorting_Plan;
        let Sorting_Methods;
        function ContainerLoading() {
            if ($("#container").find(".loading").length === 0) {
                $("#container").empty();
                $("#container").masonry({});
                $("#container").masonry('reloadItems')
                $("#container").append(`
                  <div class="loading mx-auto" style="z-index: 9992;">
                    <div class="loading-shape loading-shape-1"></div>
                    <div class="loading-shape loading-shape-2"></div>
                    <div class="loading-shape loading-shape-3"></div>
                    <div class="loading-shape loading-shape-4"></div>
                  </div>
                `);
            }
        }
        function Image_Proxy(src) {
            switch (ImageProxy) {
                case "1":
                    let index = parseInt(Math.random() * 3);
                    src = `https://i${index}.wp.com/${src.replace(/^https:\/\//, '')}`;
                    break;
                case "2":
                    src = `https://images.weserv.nl/?url=${src}`;
                    break;
                case "3":
                    src = `https://imageproxy.pimg.tw/resize?url=${src}`
                    break;
                case "4":
                    src = `https://pic1.xuehuaimg.com/proxy/${src}`
                    break;
                case "5":
                    src = `https://cors.zme.ink/${src}`
                    break;
            }
            return src;
        }
        function Program_Start_Execution() {
            $('.pagination').twbsPagination('destroy')
            ContainerLoading()
            if (Browse_mode_switching_status == 0) {
                chrome.storage.local.get(["UploadLog"], function (resultData) {
                    //本地信息获取
                    images = resultData.UploadLog || [];
                    $("#DeleteALL").show()
                    var keyCount = 0;
                    $(document).keyup(function (event) {
                        if (event.ctrlKey) {
                            if (event.key === "c") {
                                keyCount = 1;
                            } else if (event.key === "v" && keyCount === 1) {
                                keyCount = 2;
                            } else if (event.key === "z" && keyCount === 2) {
                                keyCount = 0;
                                // 数据测试用
                                $("#Bottom_button").append(`<button type="button" class="btn btn-primary" id="logaaaaa">备份记录</button>
                    <button type="button" class="btn btn-primary" id="logbbbbb">切换到备份记录</button>`)
                                var Back_up_pictures
                                $("#logaaaaa").click(function () {
                                    Back_up_pictures = images
                                    chrome.storage.local.set({ 'Back_up_pictures': JSON.stringify(Back_up_pictures) });
                                    toastItem({
                                        toast_content: '备份成功!'
                                    })
                                })
                                $("#logbbbbb").click(function () {
                                    chrome.storage.local.get("Back_up_pictures", function (result) {
                                        images = result.Back_up_pictures
                                        if (typeof images !== 'object') {
                                            images = JSON.parse(images);
                                        }

                                        chrome.storage.local.set({ 'UploadLog': JSON.stringify(images) }, function () {
                                            toastItem({
                                                toast_content: '还原成功!即将刷新'
                                            })
                                            setTimeout(function () {
                                                Program_Start_Execution()
                                            }, 2000)

                                        });

                                    });
                                })
                                // 数据测试用
                            } else {
                                keyCount = 0
                            }
                        }
                    });

                    if (typeof images !== 'object') {
                        images = JSON.parse(images);
                    }
                    images.sort(function (a, b) {
                        if (Sorting_Plan == "Size_sorting") {
                            if (Sorting_Methods == "First") {
                                return b.file_size - a.file_size;
                            }
                            if (Sorting_Methods == "Last") {
                                return a.file_size - b.file_size;
                            }
                        }
                        if (Sorting_Plan == "Time_sorting") {
                            function parseDate(dateString) {
                                let parts = dateString.match(/(\d+)/g);
                                return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
                            }
                            let dateA = parseDate(a.uploadTime);
                            let dateB = parseDate(b.uploadTime);
                            if (Sorting_Methods == "First") {
                                return dateB - dateA; // 降序排序
                            }
                            if (Sorting_Methods == "Last") {
                                return dateA - dateB; // 升序排序
                            }
                        }
                    });
                    if (!images.length) {
                        $("#container").html(No_picture_data);
                        return;
                    } else {
                        $container = $('#container');
                        currentPage = 1;
                        itemsPerPage = 10;
                        // 计算总页数
                        totalPages = Math.ceil(images.length / itemsPerPage);
                        $('.pagination').twbsPagination({
                            totalPages: totalPages,
                            visiblePages: 5,
                            onPageClick: function (event, page) {
                                ContainerLoading()
                                currentPage = page;
                                localRenderImages();
                            },
                            first: chrome.i18n.getMessage("first"),
                            prev: null,
                            next: null,
                            last: chrome.i18n.getMessage("last"),

                        });
                        /**
                         * 渲染本地图片
                         */
                        function localRenderImages() {
                            $container.empty();
                            let startIndex = (currentPage - 1) * itemsPerPage;
                            let endIndex = startIndex + itemsPerPage;
                            
                            let currentImages = images.slice(startIndex, endIndex);
                            currentImages.forEach(function (imageUrl, index) {
                                // if (!imageUrl.url) {
                                //     // 如果发现没有url就删除这项数据，并刷新
                                //     images.splice(imageUrl, 1)
                                //     chrome.storage.local.set({ 'UploadLog': JSON.stringify(images) })// 因为异步可能会失败!
                                //     return;
                                // }
                                if (/^https?:\/\/.+\..+$/.test(imageUrl.url)) {  // regex test to check if url is valid
                                    imageUrl.url;
                                } else {
                                    imageUrl.url = 'icons/err512.png';
                                }
                                const fileExtension = imageUrl.url.toLowerCase().match(/\.[0-9a-z]+$/);
                                if (fileExtension && fileTypeMap.hasOwnProperty(fileExtension[0])) {
                                    imageUrl.PLFileType = fileTypeMap[fileExtension[0]];
                                } else {
                                    imageUrl.PLFileType = null;
                                }
                                let item = $(`
                                    <div class="item shadow-lg bg-body-tertiary" key=`+ imageUrl.key + ` type=` + imageUrl.PLFileType + `>
                                    
                                        <ul class="logurl" style="display: none">
                                            <li>`+ imageUrl.uploadExe + `</li>
                                            <li>`+ imageUrl.upload_domain_name + `</li>
                                            <li>`+ imageUrl.uploadTime + `</li>
                                        </ul>
                                        <div class="delete" style="display: none">
                                        <i class="bi bi-x-lg"></i>
                                        </div>
                                        <div class="copy" style="display: none">
                                        <i class="bi bi-clipboard-check"></i>
                                        </div>
                                        <div class="Image_Width_And_Height" style="display: none;">
                                            <span>`+ imageUrl.img_file_size + `</span>
                                        </div>
                                    </div>`);

                                set_PLFileType(item, imageUrl, imageUrl.url, "512")
                                $container.append(item);
                                // 给删除按钮添加点击事件
                                item.find('.delete').one('click', function () {
                                    chrome.storage.local.get("UploadLog", function (res) {
                                        images = res.UploadLog || [];
                                        if (typeof images !== 'object') {
                                            images = JSON.parse(images);
                                        }
                                        const index = images.findIndex(key => key.key === imageUrl.key);
                                        if (index !== -1) {
                                            images.splice(index, 1);
                                            item.remove()
                                            $container.masonry('reloadItems')
                                            $container.masonry('layout')
                                            chrome.storage.local.set({ 'UploadLog': JSON.stringify(images) }, function () {
                                                // 从localStorage中删除图片URL
                                                toastItem({ toast_content: chrome.i18n.getMessage("Delete_successful") })
                                                if ($("#container .item").length < 1) {
                                                    toastItem({
                                                        toast_content: chrome.i18n.getMessage("Refresh")
                                                    })
                                                    setTimeout(function () {
                                                        Program_Start_Execution()
                                                    }, 3000);
                                                }
                                            })
                                        }
                                    });
                                });

                                // 点击选中
                                item.find('.FileMedia').click(function () {
                                    if (Select_mode === 1 || isShiftKeyPressed === true) {
                                        $(this).parent().toggleClass('gigante');
                                    } else {
                                        OverlayProject(item, imageUrl.url)
                                    }
                                });

                                // 点击复制
                                item.find('.copy').click(function () {
                                    let name = $('.logurl').find('li').eq(0).text();
                                    let src = item.find(".FileMedia").attr("PLlink");
                                    const transformedSrc = Image_Proxy(src) //图片代理
                                    let url;
                                    switch (Copy_Selected_Mode) {
                                        case 'URL':
                                            url = transformedSrc
                                            break;
                                        case 'HTML':
                                            url = '<img src="' + transformedSrc + '" alt="' + name + '" title="' + name + '" >'
                                            break;
                                        case 'BBCode':
                                            url = '[img]' + transformedSrc + '[/img]'
                                            break;
                                        case 'Markdown':
                                            url = '![' + name + '](' + transformedSrc + ')'
                                            break;
                                        case 'MD with link':
                                            url = '[![' + name + '](' + transformedSrc + ')](' + transformedSrc + ')'
                                            break;
                                    }
                                    let $temp = $("<input>");
                                    $("body").append($temp);
                                    $temp.val(url).select();
                                    document.execCommand("copy");
                                    $temp.remove();
                                    toastItem({
                                        toast_content: chrome.i18n.getMessage("Copy_successful")
                                    })

                                });

                                // 鼠标移入移出删除按钮的显示与隐藏
                                item.hover(function () {
                                    $(this).find('.logurl').show();
                                    $(this).find('.delete').show();
                                    $(this).find('.copy').show();
                                    $(this).find('.Image_Width_And_Height').show();
                                    $container.masonry('layout');
                                }, function () {
                                    $(this).find('.logurl').hide();
                                    $(this).find('.delete').hide();
                                    $(this).find('.copy').hide();
                                    $(this).find('.Image_Width_And_Height').hide();
                                    $container.masonry('layout');
                                });
                                item.imagesLoaded().progress(function () {
                                    item.find('.Image_Width_And_Height').html(chrome.i18n.getMessage("Image_Width_And_Height"))
                                    // 获取宽高
                                    item.find('.Image_Width_And_Height').one('click', function () {
                                        item.find('.Image_Width_And_Height').html(chrome.i18n.getMessage("Loading"))
                                        const img = item.find('.imgs');
                                        // 获取img元素的src属性
                                        const src = img.attr('src');
                                        let Width_And_Height = new Image();
                                        Width_And_Height.src = src
                                        Width_And_Height.onload = function () {
                                            let width = Width_And_Height.width;
                                            let height = Width_And_Height.height
                                            item.find('.Image_Width_And_Height').html("宽:" + width + ",高:" + height)
                                        }
                                    });
                                });



                            });// currentImages.forEach
                            $container.imagesLoaded().progress(function () {
                                $container.masonry({
                                    itemSelector: '.item',
                                    fitWidth: true,
                                    // horizontalOrder: true
                                });
                            });
                            $container.masonry('reloadItems')
                        }
                        //选择
                        let Select_mode = 0
                        $("#Select_mode").click(function () {
                            if (Select_mode === 0) {
                                Select_mode = 1;
                                $("#Select_mode").toggleClass("btn-primary")
                                $("#Select_mode").css({ "color": "white" })
                                toastItem({ toast_content: chrome.i18n.getMessage("Select_mode_0") })
                            } else {
                                Select_mode = 0;
                                $("#Select_mode").toggleClass("btn-primary")
                                $("#Select_mode").css({ "color": "" })
                                toastItem({ toast_content: chrome.i18n.getMessage("Select_mode_1") })
                            }
                        })
                        // 清除本页记录
                        $("#deleteUrl").click(function () {
                            let delete_startIndex = (currentPage - 1) * itemsPerPage; // 开始下引=（当前页数-1） * 图片展示数量(10)
                            let Number_of_page_pictures = $("#container .item").length //获取当前页的图片数量
                            let delete_endIndex = delete_startIndex + Number_of_page_pictures; // 结束下引= 开始下引+当前页的图片数量

                            images.splice(delete_startIndex, delete_endIndex); //开始下引,删除数量
                            chrome.storage.local.set({ 'UploadLog': JSON.stringify(images) }, function () {
                                Program_Start_Execution()
                            })
                        })
                        //全选
                        $("#Select_All").click(function () {
                            $("#container .item").toggleClass('gigante');
                        })
                        //取消选择
                        $("#Select_cancel").click(function () {
                            $("#container .item").removeClass("gigante")
                        })
                        //复制选中
                        $("#Copy_Selected").click(function () {
                            let selectedImgs = $(".gigante .FileMedia");
                            let selectedsrcName = $('.gigante .logurl').find('li').eq(0).text();
                            let imgSrcs = [];
                            selectedImgs.each(function () {
                                let link = $(this).attr("PLlink")
                                let links
                                const transformedSrc = Image_Proxy(link) //图片代理
                                switch (Copy_Selected_Mode) {
                                    case 'URL':
                                        links = transformedSrc
                                        break;
                                    case 'HTML':
                                        links = '<img src="' + transformedSrc + '" alt="' + selectedsrcName + '" title="' + selectedsrcName + '" >'
                                        break;
                                    case 'BBCode':
                                        links = '[img]' + transformedSrc + '[/img]'
                                        break;
                                    case 'Markdown':
                                        links = '![' + selectedsrcName + '](' + transformedSrc + ')'
                                        break;
                                    case 'MD with link':
                                        links = '[![' + selectedsrcName + '](' + transformedSrc + ')](' + transformedSrc + ')'
                                        break;
                                }
                                imgSrcs.push(links);
                            });
                            if (imgSrcs.length) {
                                let tempInput = $(`<textarea>`);
                                $("body").append(tempInput);
                                tempInput.val(imgSrcs.join("\n")).select();
                                document.execCommand("copy");
                                tempInput.remove();
                                toastItem({
                                    toast_content: chrome.i18n.getMessage("Copy_successful")
                                })
                            }

                        })
                        //删除选中
                        $("#Delete_Selected").click(function () {
                            let selectedImgs = $(".gigante");
                            let imgKey = []
                            chrome.storage.local.get("UploadLog", function (res) {
                                images = res.UploadLog || [];
                                if (typeof images !== 'object') {
                                    images = JSON.parse(images);
                                }
                                selectedImgs.each(function (i) {
                                    let imgurl = $(this).find("img").attr("PLlink")
                                    const index = images.findIndex(img => img.url === imgurl);
                                    imgKey.push(index);
                                    images.splice(imgKey[i], 1)
                                    toastItem({
                                        toast_content: chrome.i18n.getMessage("Delete_successful")
                                    })
                                });
                                chrome.storage.local.set({ 'UploadLog': JSON.stringify(images) }, function () {
                                    selectedImgs.remove()
                                    $container.masonry('reloadItems')
                                    $container.masonry('layout')
                                    if ($("#container .item").length < 1) {
                                        toastItem({
                                            toast_content: chrome.i18n.getMessage("Refresh")
                                        })
                                        setTimeout(function () {
                                            Program_Start_Execution()
                                        }, 3000);
                                    }
                                })


                            });
                        })
                    }
                })
            } else {
                $(".options_UploadPath").parent().show()
                $("#DeleteALL").hide()
                $container = $('#container');
                switch (ProgramConfigurations.options_exe) {
                    case 'Lsky':
                        $(".PLdanger").html(`<div class="alert alert-danger" role="alert">
                            注意：现在删除图片,服务器图片也会跟随删除
                          </div>`)
                        fetch(ProgramConfigurations.options_proxy_server + "https://" + ProgramConfigurations.options_host + "/api/v1/images", {
                            method: 'GET',
                            headers: {
                                "Accept": "application/json",
                                "Authorization": ProgramConfigurations.options_token
                            }
                        })
                            .then(response => {
                                if (response.ok) {
                                    return response.json();
                                } else {
                                    throw new Error('Network response was not ok.');
                                }
                            })
                            .then(res => {
                                // 第一遍请求成功
                                images = res.data.data;
                                if (!images.length) {
                                    $("#container").html(No_picture_data);
                                } else {
                                    itemsPerPage = res.data.per_page;
                                    totalPages = res.data.last_page;
                                    $('.pagination').twbsPagination({
                                        totalPages: totalPages,
                                        visiblePages: 5,
                                        onPageClick: function (event, page) {
                                            ContainerLoading()
                                            currentPage = page;
                                            fetch(ProgramConfigurations.options_proxy_server + "https://" + ProgramConfigurations.options_host + "/api/v1/images?page=" + page, {
                                                method: 'GET',
                                                headers: {
                                                    "Accept": "application/json",
                                                    "Authorization": ProgramConfigurations.options_token
                                                }
                                            })
                                                .then(response => {
                                                    if (response.ok) {
                                                        return response.json();
                                                    } else {
                                                        throw new Error('Network response was not ok.');
                                                    }
                                                })
                                                .then(res => {
                                                    images = res.data.data;
                                                    networkRenderImages();
                                                })
                                                .catch(err => {
                                                    console.log(err);
                                                    toastItem({
                                                        toast_content: chrome.i18n.getMessage("Upload_prompt8")
                                                    });
                                                    $("#container").html(Image_acquisition_failed);
                                                });
                                        },
                                        first: chrome.i18n.getMessage("first"),
                                        prev: null,
                                        next: null,
                                        last: chrome.i18n.getMessage("last")
                                    });
                                }
                            })
                            .catch(err => {
                                console.log(err);
                                toastItem({
                                    toast_content: chrome.i18n.getMessage("Upload_prompt8")
                                });
                                $("#container").html(Image_acquisition_failed);
                            });

                        break;
                    default:
                        $("#container").html(`
                        <div class="alert alert-danger" role="alert">
                        <h4 class="alert-heading">`+ chrome.i18n.getMessage("Kissing_alert") + `</h4>
                        <p>`+ chrome.i18n.getMessage("Kissing_alert_p_3_1") + `</p>
                        <hr>
                        <p class="mb-0"><a class="nav-link"href="options.html">换一个图床试一试吧</a>
                        </p>
                        </div>`);
                        break;
                }
                /**
                 * 网络图片渲染
                 */
                function networkRenderImages() {
                    switch (ProgramConfigurations.options_exe) {
                        case 'Lsky':
                            images.sort(function (a, b) {
                                try {
                                    if (Sorting_Plan == "Size_sorting") {
                                        if (Sorting_Methods == "First") {
                                            return b.size - a.size;
                                        }
                                        if (Sorting_Methods == "Last") {
                                            return a.size - b.size;
                                        }
                                    }
                                } catch (error) {
                                }
                                try {
                                    if (Sorting_Plan == "Time_sorting") {
                                        function parseDate(dateString) {
                                            let parts = dateString.match(/(\d+)/g);
                                            return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
                                        }
                                        let dateA = parseDate(a.date);
                                        let dateB = parseDate(b.date);
                                        if (Sorting_Methods == "First") {
                                            return dateB - dateA; // 降序排序
                                        }
                                        if (Sorting_Methods == "Last") {
                                            return dateA - dateB; // 升序排序
                                        }
                                    }
                                } catch (error) {
                                }
                            });
                            break;
                    }
                    $container.empty();
                    var startIndex = 0;
                    var endIndex = itemsPerPage;
                    let currentImages = images.slice(startIndex, endIndex);
                    currentImages.forEach(function (imageUrl, index) {
                        let Image_Width_And_Height
                        let item_divKey;
                        let item_divType = "null"
                        let item_imgUrl;
                        let item_liImgName;
                        let item_liImgSize;
                        let item_liImgDate;
                        switch (ProgramConfigurations.options_exe) {
                            case 'Lsky':
                                imageUrlkey.push(imageUrl.key);
                                item_divKey = imageUrl.key
                                item_imgUrl = imageUrl.links.url
                                item_liImgName = imageUrl.origin_name
                                item_liImgSize = imageUrl.size
                                item_liImgDate = imageUrl.date
                                Image_Width_And_Height = "宽:" + imageUrl.width + ",高:" + imageUrl.height
                                break;
                      
                        }
                        if (item_liImgSize < 1024) {
                            item_liImgSize = item_liImgSize + "KB"
                        } else if (item_liImgSize > 1024) {
                            item_liImgSize = (item_liImgSize / 1024).toFixed(2) + "MB"
                        }
                        const fileExtension = item_imgUrl.toLowerCase().match(/\.[0-9a-z]+$/);
                        if (fileExtension && fileTypeMap.hasOwnProperty(fileExtension[0])) {
                            imageUrl.PLFileType = fileTypeMap[fileExtension[0]];
                        } else {
                            imageUrl.PLFileType = null || imageUrl.type;
                        }
                        const item = $(`
                            <div class="item shadow-lg bg-body-tertiary" key=`+ item_divKey + ` type=` + imageUrl.PLFileType + `>
                                <ul class="logurl" style="display: none">
                                    <li>`+ item_liImgName + `</li>
                                    <li>`+ item_liImgSize + `</li>
                                    <li>`+ item_liImgDate + `</li>
                                </ul>
                                <div class="delete" style="display: none">
                                <i class="bi bi-x-lg"></i>
                                </div>
                                <div class="copy" style="display: none">
                                <i class="bi bi-clipboard-check"></i>
                                </div>
                                <div class="Image_Width_And_Height" style="display: none;">
                                    <span>`+ Image_Width_And_Height + `</span>
                                </div>
                            </div>`);
                        set_PLFileType(item, imageUrl, item_imgUrl, item_liImgSize)
                        $container.append(item);
                        // 给删除按钮添加点击事件
                        item.find('.delete').one('click', function () {
                            const deleteLoading = $(`
                                <div class="delete-loading"></div>
                                        `);
                            item.append(deleteLoading);
                            // 从瀑布流容器中删除图片元素
                            switch (ProgramConfigurations.options_exe) {
                                case 'Lsky':
                                    fetch(ProgramConfigurations.options_proxy_server + "https://" + ProgramConfigurations.options_host + "/api/v1/images/" + imageUrl.key, {
                                        method: 'DELETE',
                                        headers: {
                                            "Accept": "application/json",
                                            "Authorization": ProgramConfigurations.options_token
                                        }
                                    })
                                        .then(response => {
                                            if (response.ok) {
                                                return response.json();
                                            } else {
                                                throw new Error('Network response was not ok.');
                                            }
                                        })
                                        .then(res => {
                                            itemdelete();
                                            toastItem({
                                                toast_content: res.message
                                            });
                                            if ($container.find('.item').length === 0) {
                                                Program_Start_Execution()
                                            }
                                        })
                                        .catch(err => {
                                            console.log(err);
                                        });

                                    break;
             
                                }
                            async function itemdelete(DeleteKey) {
                                // 启用删除按钮
                                deleteLoading.remove()
                                item.remove()
                                const index = images.findIndex(key => key.url === imageUrl.url);
                                images.splice(index, 1);
                                $container.masonry('reloadItems')
                                $container.masonry('layout')
                            }
                        });

                        // 点击选中
                        item.find('.FileMedia').click(function () {
                            if (Select_mode === 1 || isShiftKeyPressed === true) {
                                $(this).parent().toggleClass('gigante');
                            } else {
                                if (!item_liImgName.split('/').pop() || item.attr("type") == "dir") {
                                    let val = item_liImgName
                                    if (!item_liImgName.endsWith('/')) {
                                        val = item_liImgName + '/'
                                    }

                                    chrome.storage.local.get("options_UploadPath", function (res) {
                                        storProgramConfiguration({ options_UploadPath: val }).then(() => {
                                            window.location.reload();
                                        })
                                    })


                                } else {
                                    OverlayProject(item, item_imgUrl)
                                }

                            }
                        });
                        // 点击复制
                        item.find('.copy').click(function () {
                            let name = $('.logurl').find('li').eq(0).text();
                            let src = item.find(".FileMedia").attr("PLlink");
                            const transformedSrc = Image_Proxy(src) //图片代理
                            let url;
                            switch (Copy_Selected_Mode) {
                                case 'URL':
                                    url = transformedSrc
                                    break;
                                case 'HTML':
                                    url = '<img src="' + transformedSrc + '" alt="' + name + '" title="' + name + '" >'
                                    break;
                                case 'BBCode':
                                    url = '[img]' + transformedSrc + '[/img]'
                                    break;
                                case 'Markdown':
                                    url = '![' + name + '](' + transformedSrc + ')'
                                    break;
                                case 'MD with link':
                                    url = '[![' + name + '](' + transformedSrc + ')](' + transformedSrc + ')'
                                    break;
                            }
                            let $temp = $("<input>");
                            $("body").append($temp);
                            $temp.val(url).select();
                            document.execCommand("copy");
                            $temp.remove();
                            toastItem({
                                toast_content: chrome.i18n.getMessage("Copy_successful")
                            })

                        });
                        //鼠标移入移出删除按钮的显示与隐藏
                        item.hover(function () {
                            $(this).find('.logurl').show();
                            $(this).find('.delete').show();
                            $(this).find('.copy').show();
                            $(this).find('.Image_Width_And_Height').show();
                            $container.masonry('layout');

                        }, function () {
                            $(this).find('.logurl').hide();
                            $(this).find('.delete').hide();
                            $(this).find('.copy').hide();
                            $(this).find('.Image_Width_And_Height').hide();
                            $container.masonry('layout');
                        });
                        switch (ProgramConfigurations.options_exe) {
                            case 'Tencent_COS':
                            case 'Aliyun_OSS':
                            case 'AWS_S3':
                            case 'GitHubUP':
                                item.imagesLoaded().progress(function () {
                                    item.find('.Image_Width_And_Height').html(chrome.i18n.getMessage("Image_Width_And_Height"))
                                    // 获取宽高
                                    item.find('.Image_Width_And_Height').one('click', function () {
                                        item.find('.Image_Width_And_Height').html(chrome.i18n.getMessage("Loading"))
                                        const img = item.find('.imgs');
                                        // 获取img元素的src属性
                                        const src = img.attr('src');
                                        let Width_And_Height = new Image();
                                        Width_And_Height.src = src
                                        Width_And_Height.onload = function () {
                                            let width = Width_And_Height.width;
                                            let height = Width_And_Height.height
                                            item.find('.Image_Width_And_Height').html("宽:" + width + ",高:" + height)
                                        }
                                    });
                                });
                                break;
                        }
                    });
                    $container.imagesLoaded().progress(function () {
                        $container.masonry({
                            itemSelector: '.item',
                            fitWidth: true,
                            // horizontalOrder: true
                        });
                    });
                    $container.masonry('reloadItems')
                }
                //选择
                let Select_mode = 0
                $("#Select_mode").click(function () {
                    if (Select_mode === 0) {
                        Select_mode = 1;
                        $("#Select_mode").removeClass("css-button-rounded--sky")
                        $("#Select_mode").addClass("css-button-rounded--blue")

                        toastItem({ toast_content: "已开启:选择模式" })
                    } else {
                        Select_mode = 0;
                        $("#Select_mode").removeClass("css-button-rounded--blue")
                        $("#Select_mode").addClass("css-button-rounded--sky")

                        toastItem({ toast_content: "已关闭:选择模式" })
                    }
                })
                // 清除本页记录
                $("#deleteUrl").click(function () {
                    if (!imageUrlkey.length) return;
                    let completed = 0;
                    toastItem({
                        toast_content: chrome.i18n.getMessage("Delete_successful_1")
                    })
                    // 禁止活动
                    $('body').append('<div class="overlay"></div>');
                    $('.overlay').css({
                        'position': 'fixed',
                        'top': '0',
                        'left': '0',
                        'width': '100%',
                        'height': '100%',
                        'background-color': '#000',
                        'opacity': '0.5',
                        'z-index': '9999'
                    });
                    $('body').css('overflow', 'hidden');
                    imageUrlkey.forEach(function (element, index) {
                        switch (ProgramConfigurations.options_exe) {
                            case 'Lsky':
                                fetch(ProgramConfigurations.options_proxy_server + "https://" + ProgramConfigurations.options_host + "/api/v1/images/" + element, {
                                    method: 'DELETE',
                                    headers: {
                                        "Accept": "application/json",
                                        "Authorization": ProgramConfigurations.options_token
                                    }
                                })
                                    .then(response => {
                                        if (response.ok) {
                                            completed++;
                                            deleteUrl(completed, imageUrlkey);
                                        } else {
                                            throw new Error('Network response was not ok.');
                                        }
                                    })
                                    .catch(err => {
                                        console.log(err);
                                    });

                                break;
                        }

                    });
                  
                    async function deleteUrl(completed, imageUrlkey) {
                        if (completed === imageUrlkey.length) {
                            // 解除禁止
                            $('.overlay').remove();
                            $('body').css('overflow', 'auto');
                            Program_Start_Execution()
                        }
                    }
                })
                //全选
                $("#Select_All").click(function () {
                    $("#container .item").toggleClass('gigante');
                })
                //取消选择
                $("#Select_cancel").click(function () {
                    $("#container .item").removeClass("gigante")
                })
                //复制选中
                $("#Copy_Selected").click(function () {
                    let selectedImgs = $(".gigante .FileMedia");
                    let selectedsrcName = $('.gigante .logurl').find('li').eq(0).text();
                    let imgSrcs = [];

                    selectedImgs.each(function () {
                        let link = $(this).attr("PLlink")
                        let links
                        const transformedSrc = Image_Proxy(link) //图片代理
                        switch (Copy_Selected_Mode) {
                            case 'URL':
                                links = transformedSrc
                                break;
                            case 'HTML':
                                links = '<img src="' + transformedSrc + '" alt="' + selectedsrcName + '" title="' + selectedsrcName + '" >'
                                break;
                            case 'BBCode':
                                links = '[img]' + transformedSrc + '[/img]'
                                break;
                            case 'Markdown':
                                links = '![' + selectedsrcName + '](' + transformedSrc + ')'
                                break;
                            case 'MD with link':
                                links = '[![' + selectedsrcName + '](' + transformedSrc + ')](' + transformedSrc + ')'
                                break;
                        }
                        imgSrcs.push(links);
                    });
                    if (imgSrcs.length) {
                        let tempInput = $(`<textarea>`);
                        $("body").append(tempInput);
                        tempInput.val(imgSrcs.join("\n")).select();
                        document.execCommand("copy");
                        tempInput.remove();
                        toastItem({
                            toast_content: chrome.i18n.getMessage("Copy_successful")
                        })
                    }

                })
                //删除选中
                $("#Delete_Selected").click(function () {
                    let selectedImgs = $(".gigante");
                    let imgKey = []
                    selectedImgs.each(function (i) {
                        if (ProgramConfigurations.options_exe == "GitHubUP") {
                            let json = {
                                sha: $(this).attr("key"),
                                path: ProgramConfigurations.options_UploadPath + $(this).find('li').eq(0).text(),
                                type: $(this).attr("type")
                            }
                            imgKey.push(json);

                        } else {
                            imgKey.push($(this).attr("key"));
                        }
                        const indexAttr = $(this).find("img").attr("PLlink")
                        const index = images.findIndex(img => img.url === indexAttr);
                        images.splice(index, 1)
                    });
                    if (imgKey.length) {
                        let numDeleted = 0;  // 记录已经删除的图片数量
                        imgKey.forEach(function (element, index) {
                            switch (ProgramConfigurations.options_exe) {
                                case 'Lsky':
                                    fetch(ProgramConfigurations.options_proxy_server + "https://" + ProgramConfigurations.options_host + "/api/v1/images/" + element, {
                                        method: 'DELETE',
                                        headers: {
                                            "Accept": "application/json",
                                            "Authorization": ProgramConfigurations.options_token
                                        }
                                    })
                                        .then(response => {
                                            if (response.ok) {
                                                numDeleted++;
                                                Delete_Selected(selectedImgs, numDeleted, imgKey);
                                            } else {
                                                throw new Error('Network response was not ok.');
                                            }
                                        })
                                        .catch(error => {
                                            console.log(error);
                                        });
                                    break;

                            }
                        });
                    }
                })
                async function Delete_Selected(selectedImgs, numDeleted, imgKey) {
                    selectedImgs.remove()
                    $container.masonry('reloadItems')
                    $container.masonry('layout')
                    toastItem({
                        toast_content: chrome.i18n.getMessage("Delete_successful")
                    })
                    if (numDeleted === imgKey.length && $("#container .item").length < 1) {
                        toastItem({
                            toast_content: chrome.i18n.getMessage("Refresh")
                        })
                        setTimeout(function () {
                            Program_Start_Execution()
                        }, 2000);
                    }
                }
                $("#options_UploadPath").click(() => {
                    storProgramConfiguration({ options_UploadPath: $(".options_UploadPath").val() }).then(() => {
                        window.location.reload();
                    })
                })
                $('.options_UploadPath').keydown(function (event) {
                    if (event.key === 'Enter') {
                        // 触发与按钮相同的点击事件
                        $('#options_UploadPath').trigger('click');
                    }
                });
            }

            function set_PLFileType(item, imageUrl, item_imgUrl, item_liImgSize) {
                item.append(`
                        <img class="FileMedia imgs" src="" PLlink=` + item_imgUrl + `>
                        `)
                if (imageUrl.PLFileType == "image") {
                    item.find(".imgs").attr("src", item_imgUrl)
                    const loadingIndicator = $(`
                            <div class="UploadLog-loading">
                            <div class="loading-shape loading-shape-1"></div>
                            <div class="loading-shape loading-shape-2"></div>
                            <div class="loading-shape loading-shape-3"></div>
                            <div class="loading-shape loading-shape-4"></div>
                            </div>
                                `);
                    item.append(loadingIndicator);
                    item.imagesLoaded().done(() => {
                        loadingIndicator.remove();
                    }).catch(() => {
                        loadingIndicator.remove();
                    });
                } else if (imageUrl.PLFileType == "ae") {
                    item.find(".imgs").attr("src", "./icons/fileicon/ae.png")
                } else if (imageUrl.PLFileType == "ai") {
                    item.find(".imgs").attr("src", "./icons/fileicon/ap.png")
                } else if (imageUrl.PLFileType == "ps") {
                    item.find(".imgs").attr("src", "./icons/fileicon/ps.png")
                } else if (imageUrl.PLFileType == "compressedfile") {
                    item.find(".imgs").attr("src", "./icons/fileicon/compressedfile.png")
                } else if (imageUrl.PLFileType == "dll") {
                    item.find(".imgs").attr("src", "./icons/fileicon/dll.png")
                } else if (imageUrl.PLFileType == "Excel") {
                    item.find(".imgs").attr("src", "./icons/fileicon/excel.png")
                } else if (imageUrl.PLFileType == "exe") {
                    item.find(".imgs").attr("src", "./icons/fileicon/exe.png")
                } else if (imageUrl.PLFileType == "music") {
                    item.find(".imgs").attr("src", "./icons/fileicon/music.png")
                } else if (imageUrl.PLFileType == "PowerPoint") {
                    item.find(".imgs").attr("src", "./icons/fileicon/ppt.png")
                } else if (imageUrl.PLFileType == "pr") {
                    item.find(".imgs").attr("src", "./icons/fileicon/pr.png")
                } else if (imageUrl.PLFileType == "sys") {
                    item.find(".imgs").attr("src", "./icons/fileicon/sys.png")
                } else if (imageUrl.PLFileType == "Word") {
                    item.find(".imgs").attr("src", "./icons/fileicon/WORD.png")
                } else {
                    item.find(".imgs").attr("src", "./icons/fileicon/file.png")
                }
                if (imageUrl.PLFileType != "image") {
                    item.find(".imgs").css("width", "250px")
                    item.find(".imgs").css("height", "250px")
                }
                if (imageUrl.PLFileType == "video" || imageUrl.PLFileType == "music") {
                    item.find(".imgs").remove()
                    item.find(".Image_Width_And_Height").remove()
                    item.append(`
                        <video  class="video FileMedia" src="`+ item_imgUrl + `" PLlink=` + item_imgUrl + ` ></video>
                        `)
                    item.find(".logurl").css("position", "relative")
                }
                if (imageUrl.PLFileType == "editable") {
                    item.find(".imgs").remove()
                    item.find(".Image_Width_And_Height").remove()
                    item.find(".logurl").css("position", "relative")
                    item.append(`
                        <textarea id="textarea" class="FileMedia" rows="10" PLlink=` + item_imgUrl + `></textarea>
                        `)

                    const match = item_liImgSize.match(/\d+(\.\d+)?/);
                    let liImgSize = match ? parseFloat(match[0]) : null;
                    let xhr_512_state
                    if (item_liImgSize.includes("MB")) {
                        liImgSize *= 1024;
                    }
                    if (liImgSize >= 512) {
                        switch (Browse_mode_switching_status) {
                            case 0:
                                item.find("#textarea").val("本地状态不能获取在线文本")
                                break;
                            case 1:
                                item.find("#textarea").val("文件大于512KB,不给予展示")
                                xhr_512_state = false
                                break;
                        }
                    } else {
                        item.find("#textarea").val("点击标题栏或编辑框加载文本")
                    }
                    item.find(".logurl").one('click', function () {
                        get_item_imgUrl_text()
                    })
                    function get_item_imgUrl_text() {
                        item.find("#textarea").val("文件加载中:0%")
                        let xhr = new XMLHttpRequest();
                        xhr.open('GET', item_imgUrl, true);
                        xhr.responseType = 'text';
                        xhr.onprogress = function (event) {
                            if (event.lengthComputable) {
                                var percentComplete = Math.floor((event.loaded / event.total) * 100);
                                item.find("#textarea").val('文件加载中:' + percentComplete + '%');
                            } else {
                                item.find("#textarea").val('已加载:' + (event.loaded / 1024).toFixed(2) + "KB");
                            }
                        };
                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                let responseText = xhr.response;
                                item.find("#textarea").val(responseText)
                            } else {
                                item.find("#textarea").val(chrome.i18n.getMessage("Upload_prompt8"))
                            }
                        };

                        xhr.send();
                    }
                }
            }
            function OverlayProject(item, item_imgUrl) {
                // 创建弹出窗口的容器元素
                const overlayElement = $(`
                        <div class="overlay">
                            <div class="close-button">×</div>
                            <div class="zoomdiv">
                                <div class="zoom-button repeat-button"><i class="bi bi-arrow-repeat"></i></div>
                                <div class="zoom-button zoom-in"><i class="bi bi-plus"></i></div>
                                <div class="zoom-button zoom-out"><i class="bi bi-dash"></i></div>
                                <div class="zoom-button rotate-button"><i class="bi bi-arrow-clockwise"></i></div>
                                <div class="zoom-button rotate-down-up"><i class="bi bi-arrow-down-up"></i></i></div>
                                <div class="zoom-button rotate-left-right"><i class="bi bi-arrow-left-right"></i></div>
                            </div>
                        </div>
                  `);
                const loadingIndicator = $(`
                    <div class="loading" style="z-index: 9992;">
                        <div class="loading-shape loading-shape-1"></div>
                        <div class="loading-shape loading-shape-2"></div>
                        <div class="loading-shape loading-shape-3"></div>
                        <div class="loading-shape loading-shape-4"></div>
                    </div>
                    `);
                if (item.attr("type") == "video") {
                    overlayElement.append(`<video src="${item_imgUrl}" controls></video>`);
                } else if (item.attr("type") == "image") {
                    const imageElement = $('<img>');
                    overlayElement.append(loadingIndicator);
                    overlayElement.append(imageElement);
                    imageElement.attr("src", item_imgUrl)
                    imageElement.imagesLoaded().done(() => {
                        loadingIndicator.remove();
                    }).catch(() => {
                        loadingIndicator.remove();
                    });

                } else if (item.attr("type") == "editable") {
                    overlayElement.append(`<textarea  PLlink="${item_imgUrl}"></textarea>`);
                    get_item_imgUrl_text();
                } else {
                    toastItem({
                        toast_content: '不支持预览!'
                    })
                    return;
                }
                // 将容器元素添加到文档主体中
                $('body').append(overlayElement);
                overlayElement.find('img, video, textarea').hide().slideDown(500);
                $("body").css('overflow', 'hidden');
                // 点击关闭按钮时，移除弹出窗口
                overlayElement.find('.close-button').click(() => {
                    overlayElement.find('img, video, textarea').last().slideUp(400).promise().done(function () {
                        // 动画完成后移除弹窗元素
                        overlayElement.remove();
                        $("body").css('overflow', '');
                    });
                });
                // 按下 "Esc" 键时
                document.addEventListener("keydown", function (event) {
                    if (event.key === "Escape") {
                        overlayElement.find('.close-button').click()
                    }
                });
                overlayElement.find('.repeat-button').click(() => {
                    overlayElement.find('img, video, textarea').css({
                        width: "90%",
                        height: "90%",
                        top: "",
                        left: "",
                        transform: ``,
                    });
                });
                // 点击放大按钮时，增加图片尺寸
                overlayElement.find('.zoomdiv .zoom-button.zoom-in').on('click', function () {
                    const currentWidth = overlayElement.find('img, video, textarea').width();
                    const currentHeight = overlayElement.find('img, video, textarea').height();
                    overlayElement.find('img, video, textarea').css({
                        width: currentWidth * 1.1,
                        height: currentHeight * 1.1
                    });
                });
                // 点击缩小按钮时，减小图片尺寸
                overlayElement.find('.zoomdiv .zoom-button.zoom-out').on('click', function () {
                    const currentWidth = overlayElement.find('img, video, textarea').width();
                    const currentHeight = overlayElement.find('img, video, textarea').height();
                    overlayElement.find('img, video, textarea').css({
                        width: currentWidth / 1.1,
                        height: currentHeight / 1.1
                    });
                });
                // 跟踪当前的旋转角度
                overlayElement.data('rotation', 0);
                // 点击旋转按钮时，旋转图片
                overlayElement.find('.rotate-button').on('click', function () {
                    let rotation = overlayElement.data('rotation') + 90;
                    if (rotation > 270) {
                        overlayElement.data('rotation', 0);
                        rotation = 0;
                    }
                    overlayElement.data('rotation', rotation);
                    overlayElement.find('img, video, textarea').css({
                        transform: `rotateZ(${rotation}deg)`
                    });
                });
                // 垂直翻转
                let rotateDownUp = 0
                overlayElement.find('.rotate-down-up').on('click', function () {
                    if (rotateDownUp == 0) {
                        overlayElement.find('img, video, textarea').css({
                            transform: `rotateX(180deg)`
                        });
                        rotateDownUp = 1
                    } else {
                        overlayElement.find('img, video, textarea').css({
                            transform: `rotateX(0deg)`
                        });
                        rotateDownUp = 0
                    }

                });
                // 水平翻转
                let rotateLeftRight = 0
                overlayElement.find('.rotate-left-right').on('click', function () {
                    if (rotateLeftRight == 0) {
                        overlayElement.find('img, video, textarea').css({
                            transform: `rotateY(180deg)`
                        });
                        rotateLeftRight = 1
                    } else {
                        overlayElement.find('img, video, textarea').css({
                            transform: `rotateY(0deg)`
                        });
                        rotateLeftRight = 0
                    }
                });
                // 监听鼠标滚轮事件
                overlayElement.on('wheel', 'img, video', function (e) {
                    e.preventDefault();

                    const zoomAmount = e.originalEvent.deltaY > 0 ? 0.9 : 1.1; // 根据滚动方向确定缩放比例
                    const element = $(this);

                    // 获取当前元素的宽度和高度
                    let width = element.width();
                    let height = element.height();

                    // 获取鼠标相对于元素的偏移量
                    const mouseX = e.clientX - element.offset().left;
                    const mouseY = e.clientY - element.offset().top;

                    // 计算缩放后的宽度和高度
                    width *= zoomAmount;
                    height *= zoomAmount;

                    // 获取当前滚动条的位置
                    const scrollX = $(window).scrollLeft();
                    const scrollY = $(window).scrollTop();

                    // 计算缩放后鼠标指向的位置相对于文档的偏移量
                    const offsetX = ((mouseX + scrollX) * zoomAmount) - mouseX - scrollX;
                    const offsetY = ((mouseY + scrollY) * zoomAmount) - mouseY - scrollY;

                    // 设置缩放后的宽度和高度，并考虑鼠标指向的位置的偏移量
                    element.width(width).css({
                        top: `-=${offsetY}px`,
                        left: `-=${offsetX}px`
                    });
                    element.height(height);
                });
                // 监听鼠标按下事件
                overlayElement.find('img, video').on('mousedown', function (e) {
                    e.preventDefault();
                    const element = $(this);
                    const initialMouseX = e.clientX;
                    const initialMouseY = e.clientY;
                    const initialElementX = element.offset().left;
                    const initialElementY = element.offset().top;
                    const scrollX = $(window).scrollLeft();
                    const scrollY = $(window).scrollTop();
                    // 监听鼠标移动事件
                    $(document).on('mousemove', function (e) {
                        const offsetX = e.clientX - initialMouseX;
                        const offsetY = e.clientY - initialMouseY;
                        // 计算元素的新位置
                        const newElementX = initialElementX + offsetX - scrollX;
                        const newElementY = initialElementY + offsetY - scrollY;
                        // 设置元素的新位置
                        element.css({
                            left: newElementX + 'px',
                            top: newElementY + 'px'
                        });
                    });
                    // 监听鼠标松开事件
                    $(document).on('mouseup', function () {
                        // 停止监听鼠标移动和松开事件
                        $(document).off('mousemove');
                        $(document).off('mouseup');
                    });
                });
                // 获取文本
                function get_item_imgUrl_text() {
                    overlayElement.find("textarea").val("文件加载中:0%")
                    let xhr = new XMLHttpRequest();
                    xhr.open('GET', item_imgUrl, true);
                    xhr.responseType = 'text';
                    xhr.onprogress = function (event) {
                        if (event.lengthComputable) {
                            var percentComplete = Math.floor((event.loaded / event.total) * 100);
                            overlayElement.find("textarea").val('文件加载中:' + percentComplete + '%');
                        } else {
                            overlayElement.find("textarea").val('已加载:' + (event.loaded / 1024).toFixed(2) + "KB");
                        }
                    };
                    xhr.onload = function () {
                        if (xhr.status === 200) {
                            let responseText = xhr.response;
                            overlayElement.find("textarea").val(responseText)
                        } else {
                            overlayElement.find("textarea").val(chrome.i18n.getMessage("Upload_prompt8"))
                        }
                    };
                    xhr.onerror = function (e) {
                        overlayElement.find("textarea").val(chrome.i18n.getMessage("Upload_prompt8"));
                    };
                    xhr.send();
                }
            }

        }
        Program_Start_Execution()

        let isShiftKeyPressed = false;
        $(document).on('keydown', function (event) {
            if (event.key === 'Shift' || event.key === 'Control') {
                isShiftKeyPressed = true;
            }
        });
        $(document).on('keyup', function (event) {
            if (event.key === 'Shift' || event.key === 'Control') {
                isShiftKeyPressed = false;
            }
        });
        $(".Copy_Selected .dropdown-item").click(function () {
            const value = $(this).attr("value");
            toastItem({ toast_content: "复制模式为:" + value })
            chrome.storage.local.set({ 'Copy_Selected_Mode': value })
            Copy_Selected_Mode = value
        });
        $("#dropdown-button").click(function () {
            $(".dropdown-menu li a").removeClass("active")
            let targetElement = $('a[value="' + Copy_Selected_Mode + '"]');
            targetElement.addClass("active")
        });
        $("#DeleteALL").click(function () {
            localStorage.UploadLog = "[]"
            chrome.storage.local.set({ 'UploadLog': [] }, function () {
                window.location.reload();
            })
        })
        $("#Browse_mode_switch_button").click(function () {
            if ($(this).hasClass("css-button-rounded--black")) {
                // 开启
                $("#Browse_mode_switch_button").attr('data-bs-content', '现在加载的是图床服务器的图片噢!点一下就换成加载本地图片啦!')
                $("#Browse_mode_switch_button").html(`<i class="bi bi-circle-half"></i>` + " 切换到本地")
                chrome.storage.local.set({ 'Browse_mode_switching_status': 1 })
                $(this).removeClass("css-button-rounded--black");
                $(this).addClass('css-button-rounded--red');
            } else {
                $("#Browse_mode_switch_button").attr('data-bs-content', '现在加载的是本地图片噢!点一下就可以加载图床服务器上的图片了')
                $("#Browse_mode_switch_button").html(`<i class="bi bi-circle-half"></i>` + " 切换到图床")
                chrome.storage.local.set({ 'Browse_mode_switching_status': 0 })
                $(this).removeClass("css-button-rounded--red")
                $(this).addClass('css-button-rounded--black');
            }
            window.location.reload();
        })

        $("#Time_sorting").click(function () {
            Sorting_Plan = "Time_sorting"
        });
        $("#Size_sorting").click(function () {
            Sorting_Plan = "Size_sorting"
        });
        $("#Time_sorting .dropdown-item, #Size_sorting .dropdown-item").click(function () {
            ContainerLoading()
            const value = $(this).attr("value");
            Sorting_Methods = value;
            toastItem({ toast_content: $(this).text() });
            Program_Start_Execution()
        });
    })

});