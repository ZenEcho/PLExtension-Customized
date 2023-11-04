const overlayElement = $(`.overlay`);
$("#Sidebar_area").attr("disabled", true)
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
    uploadArea = result.uploadArea || {};


    // 初始化新安装时的判断跨域开关
    if (ProgramConfigurations.options_proxy_server_state == 0) {
      ProgramConfigurations.options_proxy_server = ""
    }
    if (!ProgramConfigurations.options_proxy_server) {
      ProgramConfigurations.options_proxy_server = ""
    }

    // 初始化新安装时的imgur模式
    if (!ProgramConfigurations.options_imgur_post_mode) {
      ProgramConfigurations.options_imgur_post_mode = 0
      addToQueue(() => storProgramConfiguration({ options_imgur_post_mode: 0 }));

    }
    // 初始化新安装时的JSON转换模式
    if (!ProgramConfigurations.open_json_button) {
      ProgramConfigurations.open_json_button = 0
      addToQueue(() => storProgramConfiguration({ open_json_button: 0 }));
    }
    if (!ProgramConfigurations.custom_Base64Upload) {
      ProgramConfigurations.custom_Base64Upload = 0
      addToQueue(() => storProgramConfiguration({ custom_Base64Upload: 0 }));
    }

    function createCustomFormGroup(options) {
      const {
        label: { class: labelClass = "", text: labelValue = "" } = {},
        input: {
          type: inputType = "text",
          class: inputClass = "",
          id: inputId = "",
          inputAttr: attributes = "",
          inputPlaceholder: placeholderKey = "",
          required = false,
        } = {},
        select: {
          id: selectId = '',
          class: selectClass = "",
          optionTag: {
            value: selectOptionValue = "",
            text: selectOptionText = "",
            optionSelected = false
          } = {}
        } = {},
        textarea: {
          id: textareaId = "",
          class: textareaClass = "",
          labelText: textareaLabelText = ""
        } = {},
        additionalElement = [],
      } = options;

      // 构建 label 元素
      let labelElement = `<label for="${inputId || selectId || textareaId}" class="${labelClass}">${labelValue}</label>`;

      // 构建 input 元素
      let inputElement = `<input type="${inputType}" class="form-control box-shadow ${inputClass}" id="${inputId}" placeholder="${placeholderKey}"`;
      // 添加 required 属性
      if (required) {
        inputElement += " required";
      }
      // 添加其他自定义属性
      if (attributes) {
        inputElement += " " + attributes;
      }
      inputElement += " />";

      // 构建 select 元素
      let selectElement = `<select id="${selectId}" class="form-select box-shadow ${selectClass}">`;
      if (options.select && options.select.optionTag) {
        options.select.optionTag.forEach((option) => {
          let optionTag = `<option value="${option.value}"`
          if (option.Selected == true) {
            optionTag += ` Selected`
          }
          optionTag += `>${option.text}</option>`
          selectElement += optionTag;
        });
      }
      selectElement += `</select>`;

      let textareaElement = `
      <div class="form-floating">
        <textarea  class="form-control box-shadow ${textareaClass}" id="${textareaId}"></textarea>
        <label for="floatingTextarea">${textareaLabelText}</label>
      </div>
      `

      const additionalHtml = additionalElement ? additionalElement.join("") : "";
      if (!options.label && additionalElement.length) {
        return `${additionalHtml}`;
      }
      if (options.label) {
        if (options.input) {
          return `
          <div class="form-group">
            ${labelElement}
            ${inputElement}
          </div>
          ${additionalHtml}
        `;
        } else if (options.select) {
          return `
          <div class="form-group">
            ${labelElement}
            ${selectElement}
          </div>
          ${additionalHtml}
        `;
        } else if (options.textarea) {
          return `
          <div class="form-group">
            ${labelElement}
            ${textareaElement}
          </div>
          ${additionalHtml}
        `;
        } else {
          return `
          <div class="form-group">
            input或者select或者textarea未填写
          </div>
        `;
        }

      }
    }

    // 创建一个函数来生成表单组元素
    function createFormGroups(formGroupsData) {
      let formGroupsHtml = "";

      formGroupsData.forEach((data) => {
        const formGroupHtml = createCustomFormGroup(data);
        formGroupsHtml += formGroupHtml;
      });

      return formGroupsHtml;
    }
    const lskyCustomFormGroup = [
      {
        label: { text: chrome.i18n.getMessage("options_host") },
        input: {
          type: "text", id: "options_host", inputPlaceholder: chrome.i18n.getMessage("options_host_placeholder_lsky"), required: true,
        }
      },
      {
        label: { text: chrome.i18n.getMessage("options_token") },
        input: {
          type: "text", id: "options_token", inputPlaceholder: chrome.i18n.getMessage("options_token_placeholder_lsky"), required: true,
        }
      },
      {
        label: { class: "options_album_id", text: chrome.i18n.getMessage("options_album_id") },
        select: {
          id: "options_album_id",
        },
      },
      {
        label: { class: "options_permission", text: chrome.i18n.getMessage("options_permission") },
        select: {
          id: "options_permission_select",
          optionTag: [
            { value: "0", text: chrome.i18n.getMessage("options_permission_0"), Selected: true },
            { value: "1", text: chrome.i18n.getMessage("options_permission_1") },
          ],
        },
      },
      {
        label: { class: "options_source", text: chrome.i18n.getMessage("options_source_lsky") },
        select: {
          id: "options_source_select",
        },
      },

    ];

    const UserCustomFormGroup = [
      {
        label: { class: "options_apihost", text: chrome.i18n.getMessage("options_apihost") },
        input: {
          type: "url", id: "options_apihost", inputPlaceholder: chrome.i18n.getMessage("options_apihost_placeholder"), required: true,
        },
        additionalElement: [
          `
          <div>
          <label for="requestMethod" style=" font-size: 18px; font-weight: bold; margin-bottom: 20px;"><span class="required-marker"> *</span>`+ chrome.i18n.getMessage("Request_method") + `：</label>
          <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="requestMethod" id="requestMethod_POST" value="POST" checked>
              <label class="form-check-label" for="requestMethod_POST">POST</label>
          </div>
          <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="requestMethod" id="requestMethod_PUT" value="PUT">
              <label class="form-check-label" for="requestMethod_PUT">PUT</label>
          </div>
      </div>
          `
        ],
      },
      {
        label: { class: "options_parameter", text: chrome.i18n.getMessage("options_parameter") },
        input: {
          type: "text", id: "options_parameter", inputPlaceholder: chrome.i18n.getMessage("options_parameter_placeholder"), required: true,
        }
      },
      {
        label: { class: "options_Headers", text: chrome.i18n.getMessage("options_Headers") },
        textarea: {
          id: "options_Headers", labelText: chrome.i18n.getMessage("options_Headers_floatingTextarea")
        }
      },
      {
        label: { class: "options_Body", text: chrome.i18n.getMessage("options_Body") },
        textarea: {
          id: "options_Body", labelText: chrome.i18n.getMessage("options_Body_floatingTextarea")
        }
      },
      {
        label: { class: "options_return_success", text: chrome.i18n.getMessage("options_return_success") },
        input: {
          type: "text", id: "options_return_success", inputPlaceholder: chrome.i18n.getMessage("options_return_success_placeholder"), required: true,
        },
      },
      {
        additionalElement: [
          `<div class="form-group" style=" display: flex; ">
            <div style=" width: 100%; ">
              <label for="custom_ReturnPrefix">`+ chrome.i18n.getMessage("custom_ReturnPrefix") + `</label>
              <input type="text" class="form-control box-shadow " id="custom_ReturnPrefix" placeholder="如:https://www.google.com/">
            </div>
            <div style=" width: 100%; ">
              <label for="custom_ReturnAppend" >`+ chrome.i18n.getMessage("custom_ReturnAppend") + `</label>
              <input type="text" class="form-control box-shadow " id="custom_ReturnAppend" placeholder="如:.png">
            </div>
          </div>`
        ],
      },
      {
        additionalElement: [
          `<div class="form-group" style=" display: flex;">
            <div style=" width: 100%; ">
              <label for="Keyword_replacement1">关键词<p>(开启“关键词替换”后生效)</p></label>
              <input type="text" class="form-control box-shadow " id="Keyword_replacement1" placeholder="多个关键词使用,分割">
            </div>
            <div style=" width: 100%; ">
              <label for="Keyword_replacement2">替换为<p>(否则输入无效)</p></label>
              <input type="text" class="form-control box-shadow " id="Keyword_replacement2" placeholder="必须与关键词数量一致">
            </div>
          </div>`
        ],
      },
      {
        additionalElement: [
          `
          <div class="accordion" id="accordionPanelsStayOpenExample">
          <div class="accordion-item">
              <h2 class="accordion-header" id="panelsStayOpen-headingOne">
                  <button class="accordion-button" type="button" data-bs-toggle="collapse"
                      data-bs-target="#panelsStayOpen-collapseOne" aria-expanded="true"
                      aria-controls="panelsStayOpen-collapseOne">
                      上传前设置
                  </button>
              </h2>
              <div id="panelsStayOpen-collapseOne" class="accordion-collapse collapse show"
                  aria-labelledby="panelsStayOpen-headingOne">
                  <div class="accordion-body">
                      <div class="form-group">
                          <div class="form-check form-switch" style="margin-top: 1rem;">
                              <input class="form-check-input" type="checkbox" role="switch" id="custom_Base64Upload">
                              <label class="form-check-label" for="flexSwitchCheckDefault">`+ chrome.i18n.getMessage("custom_Base64Upload") + `
                                  </label>
                          </div>
                      </div>
                      <div class="form-group">
                          <div class="form-check form-switch" style="margin-top: 1rem;">
                              <input class="form-check-input" type="checkbox" role="switch"
                                  id="custom_Base64UploadRemovePrefix">
                              <label class="form-check-label" for="flexSwitchCheckDefault">`+ chrome.i18n.getMessage("custom_Base64UploadRemovePrefix") + `
                                  </label>
                          </div>
                      </div>
                      <div class="form-group">
                          <div class="form-check form-switch" style="margin-top: 1rem;">
                              <input class="form-check-input" type="checkbox" role="switch" id="custom_BodyUpload">
                              <label class="form-check-label" for="flexSwitchCheckDefault">`+ chrome.i18n.getMessage("custom_BodyUpload") + `
                                  </label>
                          </div>
                      </div>
                      <div class="form-group">
                          <div class="form-check form-switch" style="margin-top: 1rem;">
                              <input class="form-check-input" type="checkbox" role="switch" id="custom_BodyStringify">
                              <label class="form-check-label" for="flexSwitchCheckDefault">`+ chrome.i18n.getMessage("custom_BodyStringify") + `
                                  </label>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          <div class="accordion-item">
              <h2 class="accordion-header" id="panelsStayOpen-headingTwo">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                      data-bs-target="#panelsStayOpen-collapseTwo" aria-expanded="false"
                      aria-controls="panelsStayOpen-collapseTwo">
                      上传成功后
                  </button>
              </h2>
              <div id="panelsStayOpen-collapseTwo" class="accordion-collapse collapse"
                  aria-labelledby="panelsStayOpen-headingTwo">
                  <div class="accordion-body">
                      <div class="form-group">
                          <div class="form-check form-switch" style="margin-top: 1rem;">
                              <input class="form-check-input" type="checkbox" role="switch" id="open_json_button">
                              <label class="form-check-label" for="flexSwitchCheckDefault">` +
          chrome.i18n.getMessage("open_json_button") + `</label>
                          </div>
                      </div>
                      <div class="form-group">
                          <div class="form-check form-switch" style="margin-top: 1rem;">
                              <input class="form-check-input" type="checkbox" role="switch" id="custom_KeywordReplacement">
                              <label class="form-check-label" for="flexSwitchCheckDefault">关键词替换<p>(替换返回信息里的某一段内容)</p></label>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          <div class="accordion-item">
              <h2 class="accordion-header" id="panelsStayOpen-headingThree">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                      data-bs-target="#panelsStayOpen-collapseThree" aria-expanded="false"
                      aria-controls="panelsStayOpen-collapseThree">
                      上传变量
                  </button>
              </h2>
              <div id="panelsStayOpen-collapseThree" class="accordion-collapse collapse"
                  aria-labelledby="panelsStayOpen-headingThree">
                  <div class="accordion-body">
                  <ol class="list-group list-group-numbered">
  <li class="list-group-item d-flex justify-content-between align-items-start">
    <div class="ms-2 me-auto">
      <div class="fw-bold">$date$</div>
      表示日期:2023年10月13日
    </div>
    <div class="ms-2 me-auto">
      <div class="fw-bold">$date-yyyy$</div>
      表示年:2023
    </div>
  </li>
  <li class="list-group-item d-flex justify-content-between align-items-start">
    <div class="ms-2 me-auto">
      <div class="fw-bold">$date-mm$</div>
      表示月:10
    </div>
    <div class="ms-2 me-auto">
      <div class="fw-bold">$date-dd$</div>
      表示日:13
    </div>
  </li>
  <li class="list-group-item d-flex justify-content-between align-items-start">
    <div class="ms-2 me-auto">
      <div class="fw-bold">$date-time$</div>
      毫秒时间戳:1697183031000
    </div>
    <div class="ms-2 me-auto">
      <div class="fw-bold">$date-Time$</div>
      秒钟时间戳:1697183256
    </div>
  </li>
  <li class="list-group-item d-flex justify-content-between align-items-start">
    <div class="ms-2 me-auto">
      <div class="fw-bold">$file$</div>
      表示上传的文件,开启了Base64后表示Base64
    </div>
    <div class="ms-2 me-auto">
      <div class="fw-bold">$fileName$</div>
      表示文件名:1.png
    </div>
  </li>
  <li class="list-group-item d-flex justify-content-between align-items-start">
    <div class="ms-2 me-auto">
      <div class="fw-bold">$fileSize$</div>
      表示文件的大小
    </div>
    <div class="ms-2 me-auto">
      <div class="fw-bold">$fileType$</div>
      表示文件的类型
    </div>
  </li>
</ol>
                  </div>
              </div>
          </div>
      </div>
          `
        ],
      },
    ];


    const html_exeCORSForm = `
    <div class="form-group CorsForm">
      <label for="options_proxy_server" class="options_proxy_server">` + chrome.i18n.getMessage("options_proxy_server") + `
      </label>
      <input type="url" class="form-control box-shadow" id="options_proxy_server" placeholder="` + chrome.i18n.getMessage("options_proxy_server_placeholder") + `" />
    </div>`


    const programConfig = {
      Lsky: {
        needUid: 1,
        html: createFormGroups(lskyCustomFormGroup),
        config: ["options_host", "options_token", "options_permission_select"],
        init: function () {
          GetSource()
          Getalbums()
        },
      },
      
      UserDiy: {
        needUid: 8,
        html: createFormGroups(UserCustomFormGroup),
        config: ["options_apihost", "options_parameter", "options_Headers", "options_Body", "options_return_success", "custom_ReturnPrefix", "custom_ReturnAppend", "Keyword_replacement1", "Keyword_replacement2"],
        init: function () {
          // JSON转换
          UserDiy_customSwitch()
        },
      },

      default: {
        html: `
          <div class="alert alert-secondary" role="alert">
            <h4 class="alert-heading">` + chrome.i18n.getMessage("Program_selection_instructions_1") + `</h4>
            <p>` + chrome.i18n.getMessage("Program_selection_instructions_2") + `</p>
            <hr>
            <div id="carouselExampleCaptions" class="carousel slide" data-bs-ride="carousel">
          <!-- 按钮 -->
          <div class="carousel-indicators">
            <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="0" class="active"
              aria-current="true" aria-label="Slide 1"></button>
            <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="1"
              aria-label="Slide 2"></button>
            <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="2"
              aria-label="Slide 3"></button>
          </div>
    
          <!-- 内容 -->
          <div class="carousel-inner">
            <div class="carousel-item active">
              <img src="https://cdn-us.imgs.moe/2023/07/04/64a414574dba6.gif">
              <div class="carousel-caption d-none d-md-block" style="color: #fb06ff;">
                <h1>` + chrome.i18n.getMessage("You_know_what") + `</h1>
                <p>` + chrome.i18n.getMessage("You_know_what_1") + `</p>
              </div>
            </div>
            <div class="carousel-item">
              <img src="https://cdn-us.imgs.moe/2023/07/04/64a4145276e67.gif" loading="lazy">
              <div class="carousel-caption d-none d-md-block" style="color: #fb06ff;">
                <h1>` + chrome.i18n.getMessage("You_know_what") + `</h1>
                <p>` + chrome.i18n.getMessage("You_know_what_2") + `</p>
              </div>
            </div>
            <div class="carousel-item">
              <img src="https://cdn-us.imgs.moe/2023/07/04/64a414475a4ec.gif" loading="lazy">
              <div class="carousel-caption d-none d-md-block" style="color: #fb06ff;">
                <h1>` + chrome.i18n.getMessage("You_know_what") + `</h1>
                <p>` + chrome.i18n.getMessage("You_know_what_3") + `</p>
              </div>
            </div>
          </div>
          <!-- 左 -->
          <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleCaptions"
            data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Previous</span>
          </button>
          <!-- 右 -->
          <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleCaptions"
            data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Next</span>
          </button>
        </div>
          </div>
        `,
        init: function () {
          if (window.navigator.userAgent.indexOf('Firefox') > -1) {
            $("#carouselExampleCaptions").prepend(`<button type="button" id="firefox-permission-toggle" class="css-button-rounded--sky"style="margin-bottom: 1em;">` + chrome.i18n.getMessage("Firefox_browser_access_permissions") + `</button>`)
            $("#carouselExampleCaptions").prepend(`
                <div class="alert alert-warning" role="alert">
                ` + chrome.i18n.getMessage("Firefox_browser_access_permissions_warning") + `
                </div>
                `)
            $("#firefox-permission-toggle").click(() => {
              browser.runtime.openOptionsPage();
            })
          }
        },
      },
    };

    function initializeProgramOptions(programId) {
      const prog = programConfig[programId] || programConfig.default;
      $('.options-form').empty().append(prog.html);
      $("#Object_Storage_cors").remove()
      $("#putBucketACL").remove()
      $("#options_exe button").removeClass('active');
      prog.init();
      $(`#options_exe button[value=${programId}]`).addClass("active");

      $('#options-form').hide().slideDown('slow');
      $(".options-form input[name='requestMethod'][value='" + ProgramConfigurations.requestMethod + "']").prop('checked', true);
      $('textarea').on('input', function () {
        this.style.height = (this.scrollHeight) + 'px'; // 根据内容的滚动高度来设置文本域的高度
      });
      $('textarea').each(function () {
        this.style.height = (this.scrollHeight) + 'px';
      });

      $("input[required]").each(function () {
        // 获取对应的 label 元素
        let label = $("label[for='" + $(this).attr("id") + "']");
        // 在 label 元素的文本之前添加星号
        label.prepend("<span class='required-marker'> *</span>");
      });

      if (prog.config) {
        chrome.storage.local.get(['ProgramConfiguration'], function (result) {
          const programConfiguration = result.ProgramConfiguration || {};
          for (const key of prog.config) {
            if (programConfiguration.hasOwnProperty(key)) {
              $(`#${key}`).val(programConfiguration[key]);
            }
          }

        });
      }

      // 判断 CORS 开关
      chrome.storage.local.get(["ProgramConfiguration"], function (result) {
        if (ProgramConfigurations.options_proxy_server_state === 1) {
          Insert_CORS_Element();
        }
      });

    }
    initializeProgramOptions(ProgramConfigurations.options_exe)
    // 按钮点击事件委托
    $('#options_exe button').on('click', function () {
      const progId = $(this).attr("id").replace("exe_", "");
      initializeProgramOptions(progId);
    });


    /**
     * 获取兰空图床存储源
     */
    function GetSource() {
      if (ProgramConfigurations.options_host) {//不为空时
        fetch(ProgramConfigurations.options_proxy_server + "https://" + ProgramConfigurations.options_host + "/api/v1/strategies", {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': ProgramConfigurations.options_token
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
            let strategies = res.data.strategies;
            $("#options_source_select").empty();
            strategies.forEach(function (e, index) {
              $("#options_source_select").append(
                `<option value="` + e.id + `">` + e.name + `</option>`
              );
            });
            chrome.storage.local.get('options_source_select', function (data) {
              let selectedValue = data.options_source_select;
              let option = $('#options_source_select option[value=' + selectedValue + ']');
              if (option.length) {
                $('#options_source_select').val(selectedValue);
              } else {
                $('#options_source_select option:first').prop('selected', true);
                storProgramConfiguration({ 'options_source_select': $("#options_source_select").val() })
              }
            });
          })
          .catch(error => {
            $("#options_source_select").append(
              `<option selected value="NO">` + chrome.i18n.getMessage("Unable_to_obtain_storage_source") + `</option>`
            );
            console.error(chrome.i18n.getMessage("request_failure"), error);
          });

      }
    }
    /**
     * 获取兰空图床相册列表
     */
    function Getalbums() {
      if (ProgramConfigurations.options_host) {//不为空时
        fetch(ProgramConfigurations.options_proxy_server + "https://" + ProgramConfigurations.options_host + "/api/v1/albums", {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': ProgramConfigurations.options_token
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
            let albums = res.data.data;
            $("#options_album_id").empty();
            $("#options_album_id").append(
              `<option selected value="">` + chrome.i18n.getMessage("default") + `</option>`
            );
            albums.forEach(function (e, index) {
              $("#options_album_id").append(
                `<option value="` + e.id + `">` + e.name + `</option>`
              );
            });

            chrome.storage.local.get('options_album_id', function (data) {
              let selectedValue = data.options_album_id;
              try {
                let option = $('#options_album_id option[value=' + selectedValue + ']');
                if (option) {
                  $('#options_album_id').val(selectedValue);
                }
              } catch (error) {
                $('#options_album_id option:first').prop('selected', true);
                storProgramConfiguration({ 'options_album_id': $("#options_album_id").val() })
              }
            });
          })
          .catch(error => {
            $("#options_album_id").append(
              `<option selected value="NO">` + chrome.i18n.getMessage("Unable_to_obtain_album") + `</option>`
            );
            console.error(chrome.i18n.getMessage("request_failure"), error);
          });

      }
    }

    // 保存配置
    $("#options-form").submit(function (event) {
      event.preventDefault(); // 阻止表单的默认提交行为
      SaveFunction()
    });
    function SaveFunction() {
      let optionsExe = $("#options_exe button.active");
      if (optionsExe.length) {
        let proxyServer = $('#options_proxy_server');
        let FormData = new Object;

        if (proxyServer.val() == "") {
          toastItem({
            toast_content: chrome.i18n.getMessage("CORS_proxy_cannot_be_empty")
          })
          return;
        }
        if ($('#exe_Telegra_ph').hasClass('active')) {
          FormData['options_host'] = "telegra.ph"
        }

        $(".options-form input").each(function () {
          if (this.type === "radio") {
            if ($(this).is(':checked')) {
              FormData[this.name] = $(this).val()
            }
          } else if (this.type === "checkbox") {
            FormData[this.id] = $(this).is(':checked')
          } else {
            FormData[this.id] = $(this).val()
          }
        });


        $(".options-form select").each(function () {
          FormData[this.id] = $(this).val()
        });

        $(".options-form textarea").each(function () {
          FormData[this.id] = $(this).val()
        });

        if ($("#options_UploadPath")) {
          let PathString = $("#options_UploadPath").val()
          if (!PathString) {
            FormData['options_UploadPath'] = ""
          } else {
            if (/^[a-zA-Z0-9_\/]*$/.test(PathString) === false) {
              toastItem({
                toast_content: chrome.i18n.getMessage("Save_failed_1")
              });
              return;
            }
            // 检查输入字符串是否以 '/' 结尾
            if (!PathString.endsWith('/')) {
              PathString = PathString + '/';
            }
            FormData['options_UploadPath'] = PathString
          }
        }
        if ($('#exe_Lsky').hasClass('active')) {
          let string = $("#options_token").val()
          let pattern = /^Bearer\s/;
          if (pattern.test(string)) {
            FormData['options_token'] = $("#options_token").val()
          } else {
            FormData['options_token'] = `Bearer ` + string
          }
        }
        if ($('#exe_UserDiy').hasClass('active')) {
          FormData['options_host'] = $("#options_apihost").val()
        }

        localStorage.options_webtitle_status = 1
        toastItem({
          toast_content: chrome.i18n.getMessage("Successfully_saved_1")
        })
        FormData["options_exe"] = optionsExe.attr("value")
        storProgramConfiguration(FormData)
        storeBedConfig(FormData);
        setTimeout(function () {
          window.location.reload();
        }, 1000); // 延迟 1.5 秒（1500 毫秒）
      } else {
        toastItem({
          toast_content: chrome.i18n.getMessage("select_upload_program")
        })
      }
    }
    function sortObjectProperties(obj) {
      // 数据排序
      const sortedObj = {};
      const sortedKeys = Object.keys(obj).sort();

      for (const key of sortedKeys) {
        sortedObj[key] = obj[key];
      }

      return sortedObj;
    }

    function storeBedConfig(data) {
      let num = 50;
      const sortedData = sortObjectProperties(data);
      const BedSyncStorage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) ? chrome.storage.sync : (typeof browser !== 'undefined' && browser.storage && browser.storage.sync) ? browser.storage.sync : null;
      if (BedSyncStorage) {
        BedSyncStorage.get("BedConfig").then(result => {
          let BedConfig = result.BedConfig || [];
          if (!BedConfig.some(existingData => isSameData(existingData, sortedData))) {
            data["ConfigName"] = chrome.i18n.getMessage("Config") + BedConfig.length;
            data["ConfigTime"] = new Date().getTime();
            BedConfig.push(data);
            if (BedConfig.length >= num) {
              BedConfig.shift();
            }
            BedSyncStorage.set({ "BedConfig": BedConfig });
          }
        });
      } else {
        $(".Config-Box-Log-content").html(`<p class="text-center">该浏览器不支持此功能</p>`)
      }
    }

    function isSameData(data1, data2) {
      const excludedProps = ['ConfigName', 'ConfigTime'];
      for (const key of Object.keys(data2)) {
        if (!excludedProps.includes(key) && data1[key] !== data2[key]) {
          return false;
        }
      }
      return true;
    }

    async function readBedConfig(keys = null) {
      //BedSyncStorage 账号存储
      //BedLocalStorage 本地存储
      const BedSyncStorage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) ? chrome.storage.sync : (typeof browser !== 'undefined' && browser.storage && browser.storage.sync) ? browser.storage.sync : null;
      const BedLocalStorage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ? chrome.storage.local : (typeof browser !== 'undefined' && browser.storage && browser.storage.local) ? browser.storage.local : null;

      if (BedSyncStorage) {
        try {
          const result = await BedSyncStorage.get(keys);
          const bedConfig = result.BedConfig || [];
          $(".Config-Box-Log-content").empty();
          attachImportButtonHandler(keys); //导入
          if (bedConfig.length === 0) {
            $(".Config-Box-Log-content").html(`
                       <div class="Config-Box-Log-item">
                         <div class="BedConfigName"><span>No Data</span></div>
                         <div style="display: flex; justify-content: space-between; align-items: center;">
                           <span class="BedConfigAdd button"><i class="bi bi-plus-circle"></i></span>
                           <span class="BedConfigDel button"><i class="bi bi-x-circle"></i></span>
                         </div>
                       </div> 
            `);
            return;
          }
          bedConfig.forEach((e, index) => {
            const item = createConfigItem(e, index);
            $(".Config-Box-Log-content").append(item);
            attachEventHandlers(item, e, keys, index);
          });

          attachShareButtonHandler(keys);
          DragSort(bedConfig)
        } catch (error) {
          console.error("发生错误：", error);
        }
      } else {
        $(".Config-Box-Log-content").html(`<p class="text-center">该浏览器不支持此功能</p>`);
      }
      function createConfigItem(data, index) {
        const item = $(`
          <div class="Config-Box-Log-item" data-index="${index}"  draggable="true">
            <div class="BedConfigName" title="${data.options_exe}">
              <span data-old-value="${data.ConfigName}" title="` + chrome.i18n.getMessage("DoubleClickToEdit") + `">${data.ConfigName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <button type="button" class="BedConfigAdd button" title="`+ chrome.i18n.getMessage("Load") + `:[${data.ConfigName}|${data.options_exe}]">
                <i class="bi bi-plus-circle"></i>
              </button>
              <button type="button" class="BedConfigShare button" title="`+ chrome.i18n.getMessage("share") + `:[${data.ConfigName}|${data.options_exe}]">
                <i class="bi bi-send"></i>
              </button>
              <button type="button" class="BedConfigDel button" title="`+ chrome.i18n.getMessage("Delete") + `:[${data.ConfigName}|${data.options_exe}]">
                <i class="bi bi-x-circle"></i>
              </button>
            </div>
          </div>
        `);
        return item;
      }

      function attachEventHandlers(item, data, keys, index) {
        // 获取配置项中的各个按钮元素
        const addBtn = item.find(".BedConfigAdd");
        const shareBtn = item.find(".BedConfigShare");
        const delBtn = item.find(".BedConfigDel");
        const nameSpan = item.find(".BedConfigName span");

        // 为加载按钮添加点击事件处理程序
        addBtn.click(function () {
          $(this).prop('disabled', true);
          BedSyncStorage.get(keys).then(data => {
            const dataIndex = addBtn.parent().parent().data("index");
            if (dataIndex !== undefined) {
              const selectedData = data.BedConfig[dataIndex];
              const dataWithoutConfig = { ...selectedData };
              delete dataWithoutConfig.ConfigName;
              delete dataWithoutConfig.ConfigTime;
              storProgramConfiguration(dataWithoutConfig)
                .then(() => {
                  toastItem({
                    toast_content: chrome.i18n.getMessage("Load") + chrome.i18n.getMessage("successful")
                  });
                  localStorage.options_webtitle_status = 1
                  setTimeout(function () {
                    window.location.reload();
                  }, 1000); // 延迟
                })
                .catch((error) => {
                  console.log(error);
                });
            }
          });
        });

        // 为分享按钮添加点击事件处理程序
        shareBtn.click(function () {
          $(this).prop('disabled', true);
          BedSyncStorage.get(keys).then(data => {
            const dataIndex = shareBtn.parent().parent().data("index");
            if (dataIndex !== undefined) {
              const selectedData = data.BedConfig[dataIndex];
              const textarea = document.createElement("textarea");
              textarea.value = JSON.stringify(selectedData);
              document.body.appendChild(textarea);
              textarea.select();
              document.execCommand("copy");
              document.body.removeChild(textarea);
              toastItem({
                toast_content: chrome.i18n.getMessage("SharePrompt1")
              });
              setTimeout(function () {
                shareBtn.prop('disabled', false);
              }, 1000); // 延迟
            }
          });
        });

        // 为删除按钮添加点击事件处理程序
        delBtn.click(function () {
          $(this).prop('disabled', true);
          BedSyncStorage.get(keys).then(data => {
            const dataIndex = delBtn.parent().parent().index();
            if (dataIndex !== undefined) {
              if (data.BedConfig && data.BedConfig[dataIndex]) {
                data.BedConfig.splice(dataIndex, 1); // 删除指定索引的元素
              }
              BedSyncStorage.set({ "BedConfig": data.BedConfig }).then(() => {
                $(this).parent().parent().remove();
                toastItem({
                  toast_content: chrome.i18n.getMessage("Delete_successful")
                });
                if (data.BedConfig.length < 1) {
                  return readBedConfig();
                }
              });
            }
          });
        });

        // 为配置项名称添加双击事件处理程序
        nameSpan.dblclick(function () {
          const oldValue = $(this).data("old-value");
          const newValue = prompt(chrome.i18n.getMessage("EnterConfigurationName") + ":", oldValue);
          if (newValue !== null && newValue !== "") {
            $(this).text(newValue);
            $(this).data("old-value", newValue);
            BedSyncStorage.get(keys).then(data => {
              const updatedBedConfig = data.BedConfig.map(existingData => {
                if (existingData.ConfigName === oldValue) {
                  existingData.ConfigName = newValue;
                }
                return existingData;
              });
              BedSyncStorage.set({ "BedConfig": updatedBedConfig });
            });
          }
        });
      }

      function attachShareButtonHandler(keys) {
        $(".Config-Box-Log-footer .share-button").click(function () {
          BedSyncStorage.get(keys).then(data => {
            const textarea = document.createElement("textarea");
            textarea.value = JSON.stringify(data.BedConfig);
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            toastItem({
              toast_content: chrome.i18n.getMessage("SharePrompt1")
            });
          });
        })
      }

      function attachImportButtonHandler(keys) {
        $(".Config-Box-Log-footer .import-button").hover(function () {
          if (!$("#ImportConfigurationPopup").length) {
            let item = $(`
                        <div class="modal fade" id="ImportConfigurationPopup" tabindex="-1" aria-labelledby="ImportConfigurationPopupLabel"
                        aria-hidden="true">
                        <div class="modal-dialog">
                          <div class="modal-content">
                            <div class="modal-header">
                              <h1 class="modal-title fs-5" id="ImportConfigurationPopupLabel">`+ chrome.i18n.getMessage("ImportConfiguration") + `</h1>
                              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                              <div class="form-floating">
                                <textarea class="form-control" placeholder="配置信息" id="floatingTextarea"></textarea>
                                <label for="floatingTextarea">多段数据使用,分割!</label>
                              </div>
                            </div>
                            <div class="modal-footer">
                              <button type="button" class="btn btn-secondary close" data-bs-dismiss="modal">`+ chrome.i18n.getMessage("close") + `</button>
                              <button type="button" class="btn btn-primary replace" data-i18n="replace">`+ chrome.i18n.getMessage("replace") + `</button>
                              <button type="button" class="btn btn-primary append" data-i18n="append">`+ chrome.i18n.getMessage("append") + `</button>
                            </div>
                          </div>
                        </div>
                      </div>
                        `)
            $("body").append(item)

            item.find(".append").click(function () {
              let value = item.find("#floatingTextarea").val();
              try {
                let jsonArray;
                if (value.charAt(0) !== '[' && value.charAt(value.length - 1) !== ']') {
                  jsonArray = JSON.parse("[" + value + "]");
                } else {
                  jsonArray = JSON.parse(value);
                }
                if (!Array.isArray(jsonArray)) {
                  toastItem({
                    toast_content: "输入数据不是有效的 JSON 数组!"
                  });
                  return;
                }
                BedSyncStorage.get(keys).then(data => {
                  let BedConfig = data.BedConfig || [];
                  if (jsonArray.length > 0) {
                    for (let i = 0; i < jsonArray.length; i++) {
                      BedConfig.push(jsonArray[i]);
                    }
                  }

                  BedSyncStorage.set({ "BedConfig": BedConfig }).then(() => {
                    item.find("#floatingTextarea").val("");
                    readBedConfig();
                  });
                });
              } catch (error) {
                console.error("无法处理数据" + error);
                toastItem({
                  toast_content: "无法处理数据,请查看报错!"
                });
              }
            });
            item.find(".replace").click(function () {
              let value = item.find("#floatingTextarea").val();
              try {
                let jsonArray;
                if (value.charAt(0) !== '[' && value.charAt(value.length - 1) !== ']') {
                  jsonArray = JSON.parse("[" + value + "]");
                } else {
                  jsonArray = JSON.parse(value);
                }
                if (!Array.isArray(jsonArray)) {
                  toastItem({
                    toast_content: "输入数据不是有效的 JSON 数组!"
                  });
                  return;
                }
                BedSyncStorage.set({ "BedConfig": jsonArray }).then(() => {
                  item.find("#floatingTextarea").val("");
                  readBedConfig();
                });
              } catch (error) {
                console.error("无法处理数据" + error);
                toastItem({
                  toast_content: "无法处理数据,请查看报错!"
                });
              }
            })
          }
        })
      }
      function DragSort(bedConfig) {
        let list = $('.Config-Box-Log-content');
        let currentLi;

        // 当开始拖拽列表项时触发的事件处理函数
        list.on('dragstart', '.Config-Box-Log-item', function (e) {
          // 设置拖拽效果
          e.originalEvent.dataTransfer.effectAllowed = 'move';
          // 记录当前拖拽的列表项
          currentLi = $(this);
          setTimeout(() => {
            currentLi.addClass('moving');
          });
        });

        // 当鼠标进入其他列表项时触发的事件处理函数
        list.on('dragenter', '.Config-Box-Log-item', function (e) {
          e.preventDefault();
          if ($(this).is(currentLi)) {
            return;
          }
          let liArray = list.find('.Config-Box-Log-item');
          // 获取当前拖拽项的索引和目标项的索引
          let currentIndex = liArray.index(currentLi);
          let targetIndex = liArray.index($(this));

          if (currentIndex < targetIndex) {
            // 如果目标在当前项的下方，将当前项插入目标项的后面
            $(this).after(currentLi);
          } else {
            // 如果目标在当前项的上方，将当前项插入目标项的前面
            $(this).before(currentLi);
          }
        });
        list.on('dragover', '.Config-Box-Log-item', function (e) {
          e.preventDefault();
        });
        list.on('dragend', '.Config-Box-Log-item', function (e) {
          currentLi.removeClass('moving');

          // 获取已排序的 Config-Box-Log-item 元素的顺序
          let sortedItems = list.find('.Config-Box-Log-item');
          let newOrder = [];
          sortedItems.each(function () {
            newOrder.push($(this).data('index'));
          });

          // 从 bedConfig 中重新排列数据
          let rearrangedBedConfig = [];
          newOrder.forEach(index => {
            rearrangedBedConfig.push(bedConfig[index]);
          });
          BedSyncStorage.set({ "BedConfig": rearrangedBedConfig });
        });
      }

    }
    readBedConfig();
    /**
     * 统一插入CORS元素
     */
    function Insert_CORS_Element() {
      $("#CorsButton button").removeClass("css-button-rounded--black")
      $("#CorsButton button").addClass('css-button-rounded--red');
      $('.options-form').append(html_exeCORSForm)
      $('.CorsForm').hide().slideDown('slow');
      $('#options_proxy_server').val(ProgramConfigurations.options_proxy_server);
      if ($('#options_proxy_server').val() == "undefined") {
        $('#options_proxy_server').val("")
      }
      storProgramConfiguration({ 'options_proxy_server_state': 1 })
    }
    /**
     * 统一关闭CORS元素
     */
    function Close_CORS_Element() {
      $("#CorsButton button").removeClass("css-button-rounded--red")
      $("#CorsButton button").addClass('css-button-rounded--black');
      let $options_proxy_server = $('.options_proxy_server').parent()
      $(".CorsForm").slideUp(500, function () {
        $options_proxy_server.remove();
      });// CORS动画
      storProgramConfiguration({ 'options_proxy_server_state': 0 })
    }

    // 开启配置CORS 按钮
    $('#CorsButton').click(function () {
      if ($('#exe_Tencent_COS').hasClass('active') || $('#exe_Aliyun_OSS').hasClass('active') || $('#exe_AWS_S3').hasClass('active')) {
        toastItem({
          toast_content: chrome.i18n.getMessage("Unable_configure_CORS_proxy")
        });
        return;
      }

      if ($('#CorsButton button').is(".css-button-rounded--red")) {
        Close_CORS_Element();
        toastItem({
          toast_content: chrome.i18n.getMessage("CORS_proxy_closed")
        });
      } else {
        Insert_CORS_Element();
        toastItem({
          toast_content: chrome.i18n.getMessage("CORS_proxy_opened")
        });
      }
    });


    function UserDiy_customSwitch() {
      const stor = [
        "open_json_button",
        "custom_KeywordReplacement",
        "custom_Base64Upload",
        "custom_Base64UploadRemovePrefix",
        "custom_BodyUpload",
        "custom_BodyStringify"
      ];
      chrome.storage.local.get(['ProgramConfiguration'], function (result) {
        const programConfiguration = result.ProgramConfiguration || {};

        for (const key of stor) {
          if (programConfiguration.hasOwnProperty(key)) {
            if (programConfiguration[key] == 1) {
              $(`#${key}`).attr('checked', true);
            }

          }
        }

      });
    }


    $("#Sidebar_area").hover(function () {
      //自定义图标区域

      let uploadArea_width = uploadArea.uploadArea_width
      let uploadArea_height = uploadArea.uploadArea_height
      let uploadArea_Location = uploadArea.uploadArea_Location
      let uploadArea_opacity = uploadArea.uploadArea_opacity
      let uploadArea_auto_close_time = uploadArea.uploadArea_auto_close_time
      let uploadArea_Left_or_Right = uploadArea.uploadArea_Left_or_Right

      if (!$("#uploadArea_Modal").length) {
        $("body").append(`
        <div class="modal fade" id="uploadArea_Modal" tabindex="-1" aria-labelledby="uploadArea_ModalLabel"
        aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="uploadArea_ModalLabel">`+ chrome.i18n.getMessage("Region_settings") + `</h1>&nbsp<span
                style="font-size: 10px; color: #333;">`+ chrome.i18n.getMessage("Region_settings_tips") + `</span>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
        
            <div class="modal-body" id="PNGmodal-body">
              <div id="edit_uploadArea"></div>
              <div style="width: 125px;"></div>
              <div style="width: 250px;">
                <div>
                  <label for="uploadArea_width" class="form-label">`+ chrome.i18n.getMessage("width") + `:0px</label>
                  <input type="range" class="form-range" min="16" max="100" id="uploadArea_width">
                </div>
                <div>
                  <label for="uploadArea_height" class="form-label">`+ chrome.i18n.getMessage("height") + `:0%</label>
                  <input type="range" class="form-range" min="1" max="100" id="uploadArea_height">
                </div>
                <div>
                  <label for="uploadArea_Location" class="form-label">`+ chrome.i18n.getMessage("Location") + `:0</label>
                  <input type="range" class="form-range" min="1" max="100" id="uploadArea_Location" disabled>
                </div>
                <div>
                  <label for="uploadArea_opacity" class="form-label">`+ chrome.i18n.getMessage("opacity") + `:0</label>
                  <input type="range" class="form-range" min="5" max="100" id="uploadArea_opacity">
                </div>
                <div>
                  <label for="uploadArea_auto_close_time" class="form-label">`+ chrome.i18n.getMessage("auto_close_time") + `:2s</label>
                  <input type="range" class="form-range" min="2" max="100" id="uploadArea_auto_close_time">
                </div>
                <div style="display: flex;">
                  <label for="uploadArea_Left_or_Right" class="form-label" style="margin-right: .5rem;">`+ chrome.i18n.getMessage("uploadArea_Left_or_Right") + `:</label>
                  <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="uploadArea_Left_or_Right" id="uploadArea_Left" value="Left">
                    <label class="form-check-label" for="inlineRadio1">`+ chrome.i18n.getMessage("Left") + `</label>
                  </div>
                  <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="uploadArea_Left_or_Right" id="uploadArea_Right" value="Right">
                    <label class="form-check-label" for="inlineRadio2"> `+ chrome.i18n.getMessage("Right") + `</label>
                  </div>
                </div>
              </div>
              <div style="width: 125px;"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"><i class="bi bi-x-lg"></i>`+ chrome.i18n.getMessage("close") + `</button>
              <button type="button" class="btn btn-danger" id="uploadArea_reset" data-bs-dismiss="modal"><i
                  class="bi bi-arrow-repeat"></i>`+ chrome.i18n.getMessage("reset") + `</button>
              <button type="button" class="btn btn-primary" id="uploadArea_save"><i
                  class="bi bi-check-lg"></i>`+ chrome.i18n.getMessage("save") + `</button>
            </div>
          </div>
        </div>
        </div>
        `)
        let uploadArea_width_value //宽度
        let uploadArea_height_value //高度
        let uploadArea_Location_value //位置
        let uploadArea_opacity_value //透明度
        let uploadArea_auto_close_time_value //自动关闭时间


        let edit_uploadArea = $("#edit_uploadArea")
        let uploadAreaParent = $("#PNGmodal-body")
        // 定义初始变量
        let isDragging = false;
        let dragStart = 0;
        let dragOffset = 0;
        // 监听鼠标按下事件
        edit_uploadArea.mousedown(function (event) {
          isDragging = true;
          dragStart = event.clientY;
          dragOffset = edit_uploadArea.offset().top - uploadAreaParent.offset().top;
        });
        $(document).mousemove(function (event) {
          let parentHeight = uploadAreaParent.height();
          if (isDragging) {
            let dragPos = event.clientY - dragStart + dragOffset;
            if (dragPos < 0) {
              dragPos = 0;
            }
            if (dragPos > uploadAreaParent.height() - edit_uploadArea.height()) {
              dragPos = uploadAreaParent.height() - edit_uploadArea.height();
            }
            uploadArea_Location_value = parseInt(dragPos / (parentHeight / 100));
            $("#uploadArea_Location").prev('label').text(chrome.i18n.getMessage("Location") + ":" + uploadArea_Location_value + "%");
            uploadArea_Location = uploadArea_Location_value
            edit_uploadArea.css("top", dragPos);
            uploadAreaParent.scrollTop(dragPos);
          }
        });

        // 监听鼠标松开事件
        $(document).mouseup(function () {
          isDragging = false;
        });
        // 宽度
        edit_uploadArea.css('width', uploadArea_width + 'px');
        $("#uploadArea_width").attr("value", uploadArea_width)
        $("#uploadArea_width").prev('label').text(chrome.i18n.getMessage("width") + ':' + uploadArea_width + "px");
        // 高度

        edit_uploadArea.css('height', uploadArea_height + '%');
        $("#uploadArea_height").attr("value", uploadArea_height)
        $("#uploadArea_height").prev('label').text(chrome.i18n.getMessage("height") + ':' + uploadArea_height + "%");
        switch (uploadArea_Left_or_Right) {
          case 'Left':
            if (uploadArea_height > 99) {
              edit_uploadArea.css("border-radius", "0px 10px 10px 0px")
            } else {
              edit_uploadArea.css("border-radius", "0")
            }
            break;
          case 'Right':
            if (uploadArea_height > 99) {
              edit_uploadArea.css("border-radius", "10px 0px 0px 10px")
            } else {
              edit_uploadArea.css("border-radius", "0")
            }
            break;
        }

        //位置
        edit_uploadArea.css('top', (uploadArea_Location * ($("#PNGmodal-body").height() / 100)) + 'px');
        $("#uploadArea_Location").attr("value", uploadArea_Location)
        $("#uploadArea_Location").prev('label').text(chrome.i18n.getMessage("Location") + ':' + (uploadArea_Location) + "%");

        //透明
        edit_uploadArea.css("background-color", `rgba(60,64,67,` + uploadArea_opacity + `)`)
        $("#uploadArea_opacity").attr("value", uploadArea_opacity * 100)
        $("#uploadArea_opacity").prev('label').text(chrome.i18n.getMessage("opacity") + ':' + uploadArea_opacity);

        //自动关闭时间
        $("#uploadArea_auto_close_time").attr("value", uploadArea_auto_close_time)
        $("#uploadArea_auto_close_time").prev('label').text(chrome.i18n.getMessage("auto_close_time") + ':' + uploadArea_auto_close_time + "s");
        switch (uploadArea_Left_or_Right) {
          case 'Left':
            $("#uploadArea_Left").attr("checked", true)
            edit_uploadArea.css("left", "0");
            break;
          case 'Right':
            $("#uploadArea_Right").attr("checked", true)
            edit_uploadArea.css("right", "0");
            break;
        }

        $("#uploadArea_Left").click(function () {
          uploadArea_Left_or_Right = "Left"
          edit_uploadArea.css("left", "0");
          if (uploadArea_height > 99) {
            edit_uploadArea.css("border-radius", "0px 10px 10px 0px")
          } else {
            edit_uploadArea.css("border-radius", "0")
          }
        })
        $("#uploadArea_Right").click(function () {
          uploadArea_Left_or_Right = "Right"
          edit_uploadArea.css("left", uploadAreaParent.width() - edit_uploadArea.width() + "px");
          if (uploadArea_height > 99) {
            edit_uploadArea.css("border-radius", "10px 0px 0px 10px")
          } else {
            edit_uploadArea.css("border-radius", "0")
          }
        })

        $('#uploadArea_width').on('input', function () {
          uploadArea_width_value = $(this).val();
          $(this).prev('label').text(chrome.i18n.getMessage("width") + ':' + uploadArea_width_value + "px");
          edit_uploadArea.css('width', uploadArea_width_value + 'px');
          uploadArea_width = uploadArea_width_value
          switch (uploadArea_Left_or_Right) {
            case 'Right':
              edit_uploadArea.css('left', uploadAreaParent.width() - uploadArea_width_value + 'px');
              break;
          }
        });

        $('#uploadArea_height').on('input', function () {
          uploadArea_height_value = $(this).val();
          let areaOffset = edit_uploadArea.offset();
          let parentOffset = edit_uploadArea.parent().offset();
          let top = areaOffset.top - parentOffset.top;
          let parentHeight = edit_uploadArea.parent().height();

          uploadArea_Location_value = parseInt((top / parentHeight) * 100);
          let from_border = uploadArea_Location_value + parseInt(uploadArea_height_value)
          $(this).prev('label').text(chrome.i18n.getMessage("height") + ':' + uploadArea_height_value + "%");
          $("#uploadArea_Location").prev('label').text(chrome.i18n.getMessage("Location") + ':' + uploadArea_Location_value + "%");
          if (from_border > 99) {
            edit_uploadArea.css("top", 0)
          }

          switch (uploadArea_Left_or_Right) {
            case 'Left':
              if (uploadArea_height_value > 99) {
                edit_uploadArea.css("border-radius", "0px 10px 10px 0px")
              } else {
                edit_uploadArea.css("border-radius", "0")
              }
              break;
            case 'Right':
              if (uploadArea_height_value > 99) {
                edit_uploadArea.css("border-radius", "10px 0px 0px 10px")
              } else {
                edit_uploadArea.css("border-radius", "0")
              }
              break;
          }

          edit_uploadArea.css('height', uploadArea_height_value + '%');
          uploadArea_height = uploadArea_height_value
          uploadArea_Location = uploadArea_Location_value

        });

        $('#uploadArea_opacity').on('input', function () {
          uploadArea_opacity_value = $(this).val() / 100;
          $("#uploadArea_opacity").prev('label').text(chrome.i18n.getMessage("opacity") + ':' + uploadArea_opacity_value);
          edit_uploadArea.css("background-color", `rgba(60,64,67,` + uploadArea_opacity_value + `)`)
          uploadArea_opacity = uploadArea_opacity_value
        });

        $('#uploadArea_auto_close_time').on('input', function () {
          uploadArea_auto_close_time_value = $(this).val();
          $("#uploadArea_auto_close_time").prev('label').text(chrome.i18n.getMessage("auto_close_time") + ':' + uploadArea_auto_close_time_value + "s");
          uploadArea_auto_close_time = uploadArea_auto_close_time_value
        });

        $("#uploadArea_save").click(function () {
          let FormData = new Object;
          $("#PNGmodal-body input").each(function () {
            if (this.type === "radio") {
              if ($(this).is(':checked')) {
                FormData[this.name] = $(this).val()
              }
            } else {
              FormData[this.id] = $(this).val()
            }
            FormData.uploadArea_opacity = $('#uploadArea_opacity').val() / 100
          });
          chrome.storage.local.set({ "uploadArea": FormData })
          toastItem({
            toast_content: chrome.i18n.getMessage("Successfully_saved_2")
          })

        })
        $("#uploadArea_reset").click(function () {
          chrome.storage.local.set({
            "uploadArea": {
              "uploadArea_width": 32,
              "uploadArea_height": 30,
              "uploadArea_Location": 34,
              "uploadArea_opacity": 0.3,
              "uploadArea_auto_close_time": 2,
              "uploadArea_Left_or_Right": "Right"
            }
          });
          toastItem({
            toast_content: chrome.i18n.getMessage("Successfully_Reset_1")
          })
        })
      }
      $("#Sidebar_area").attr("disabled", false)
    })
    document.addEventListener("keydown", function (event) {
      // 检查是否按下了Ctrl键和S键
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault(); // 阻止浏览器默认的保存页面行为
        SaveFunction()
      }
    });
  })//chrome get


  // 修复初始化时输入框读取到undefined
  let optionsNull = ['#options_host', '#options_token', '#options_uid'];
  optionsNull.forEach(function (option) {
    if ($(option).val() == "undefined") {
      $(option).val("")
    }
  });

  // 写入标题
  let options_webtitle = localStorage.options_webtitle
  $(".title-a").text(options_webtitle)

  // 初始化底部打开方式
  chrome.storage.local.get(["browser_Open_with"], function (result) {
    const mapping = {
      1: "Tab",
      2: "Window",
      3: "Inside",
    };

    const option = result.browser_Open_with;
    const button = $("#options_Open_withDiv button");

    if (mapping[option]) {
      $(`#options_Open_with_${mapping[option]} a`).addClass('active');
      button.html($(`#options_Open_with_${mapping[option]} a`).html());
    }

    for (const element in mapping) {
      $(`#options_Open_with_${mapping[element]}`).click(function () {
        if (element == 3) {
          if (window.navigator.userAgent.indexOf('Firefox') > -1) {
            toastItem({
              toast_content: chrome.i18n.getMessage("Setting_failed_2")
            })
            return;
          } else {
            alert(chrome.i18n.getMessage("Setting_successful_7"))
            chrome.storage.local.set({ 'browser_Open_with': element }, function () {
              // 打开方式为：在内置页打开
              chrome.runtime.reload();
            });
          }
        }
        chrome.storage.local.set({ 'browser_Open_with': element }, function () {
          chrome.runtime.reload();
        });

      });
    }
  });

  function initializeButtonOption() {
    const options = [
      "GlobalUpload",
      "AutoInsert",
      "AutoCopy",
      "Right_click_menu_upload",
      "ImageProxy",
      "EditPasteUpload",
    ];

    chrome.storage.local.get("FuncDomain", function (result) {
      FuncDomain = result.FuncDomain || {}
      options.forEach((key) => {
        const $element = $(`#${key}`);
        const $button = $element.find('button');
        const $dropdownItems = $element.find('.dropdown-item');
        if ($element.find(`a[value="${FuncDomain[key]}"]`).length) {
          $element.find(`a[value="${FuncDomain[key]}"]`).addClass("active");
        }
        if (FuncDomain[key] != "off" && FuncDomain[key]) {
          $element.addClass("on");
        } else {
          $element.addClass("off");
        }
        $dropdownItems.click(function () {
          const val = $(this).attr("value");

          $element.removeClass("on off");
          $element.addClass(val !== "off" ? "on" : "off");
          $button.removeClass("btn-primary btn-danger btn-dark");
          FuncDomain[key] = val
          addToQueue(() => {
            chrome.storage.local.set({ "FuncDomain": FuncDomain }, function () {
              if (key === "Right_click_menu_upload") {
                chrome.runtime.reload(); // 在保存完毕后执行刷新操作
              }
            });
          });
          $dropdownItems.removeClass("active");
          $(this).addClass("active");

        });
      });
    });
  }
  initializeButtonOption()


  $("#VERSION").text(chrome.i18n.getMessage("VERSION_1") + ":V" + chrome.runtime.getManifest().version)
  $("#VERSION").click(function () {
    $("#VERSION").text(chrome.i18n.getMessage("Obtaining"))
    fetch(`https://api.github.com/repos/ZenEcho/PLExtension/releases/latest`)
      .then(response => response.json())
      .then(data => {
        let localVersion = chrome.runtime.getManifest().version; //本地
        let remoteVersion = data.name; //远程
        if (remoteVersion) {
          let result = compareVersions(localVersion, remoteVersion);
          if (result === -1) {
            $("#VERSION").text(chrome.i18n.getMessage("VERSION_2") + ":V" + remoteVersion)
            $("#VERSION").css({ "color": "red" })
            if (confirm(chrome.i18n.getMessage("VERSION_3"))) {
              window.open("https://github.com/ZenEcho/PLExtension/releases")
            }
            // 远程版本较新
          } else {
            $("#VERSION").text(chrome.i18n.getMessage("VERSION_4") + ":V" + localVersion)
          }
        } else {
          toastItem({
            toast_content: data.message
          });
          $("#VERSION").text(chrome.i18n.getMessage("VERSION_5"))
        }

      })
      .catch(error => {
        $("#VERSION").text(chrome.i18n.getMessage("VERSION_5"))
        console.error(chrome.i18n.getMessage("Request_error"), error);
      });
  })
  function compareVersions(localVersion, remoteVersion) {
    // 将本地版本号和远程版本号拆分为部分
    let localParts = localVersion.split('.');
    let remoteParts = remoteVersion.split('.');
    // 比较每个部分的数值
    for (let i = 0; i < Math.max(localParts.length, remoteParts.length); i++) {
      let localNum = parseInt(localParts[i] || 0); // 如果部分不存在，则假设为0
      let remoteNum = parseInt(remoteParts[i] || 0); // 如果部分不存在，则假设为0
      if (localNum < remoteNum) {
        return -1; // 本地版本号较小
      } else if (localNum > remoteNum) {
        return 1; // 本地版本号较大
      }
    }
    return 0; // 版本号相等
  }

  $("#StickerSave").click(function () {
    let value = $("#StickerInput").val()
    if (value) {
      chrome.storage.local.set({ "StickerURL": value })
    } else {
      chrome.storage.local.set({ "StickerURL": "https://plextension-sticker.pnglog.com/sticker.json" })
    }
    chrome.storage.local.set({ 'StickerDATA': [] }) //表情包数据
    toastItem({
      toast_content: chrome.i18n.getMessage("Successfully_saved_2")
    })
  })
  chrome.storage.local.get(["StickerURL"], function (result) {
    if (result.StickerURL != "https://plextension-sticker.pnglog.com/sticker.json") {
      $("#StickerInput").val(result.StickerURL)
    }
  })
  animation_button2('.Animation_button2').then(function () {
    overlayElement.remove()
  });
});

