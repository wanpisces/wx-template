// widget/authorize-view/authorize-view.js
/**\
 * 如果在同一个页面多次引入此控件，请在引入时加入：refresh="{{refreshAuthorizeView}}" user-phone="{{true}}" user-info="{{true}}"
 * 若果需要立即返回请配置：is-immediately-back="{{true}}"
 */
var toolUtils = require("../../utils/tool-utils.js")
var httpsUtils = require("../../utils/https-utils.js");
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    //是否授权获取个人信息
    userInfo: {
      type: Boolean,
      value: false
    },
    //是否授权获取电话号码
    userPhone: {
      type: Boolean,
      value: false
    },
    openType: {
      type: String,
      value: 'getUserInfo'
    }
  },

  attached: function () {
    this.setData({
      openType: this.data.openType
    })
  },
  /**
   * 组件的初始数据
   */
  data: {
    openType:''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    //授权获取用户信息回调
    getUserInfo: function (e) {
      if (e.detail.errMsg == "getUserInfo:ok") {
        let that = this
        var userInfo = e.detail.userInfo
        var param = {
          user_avatar : userInfo.avatarUrl,
          user_nickname : userInfo.nickName,
          user_gender: userInfo.gender,
          user_city: userInfo.city,
          user_province: userInfo.province,
          user_country: userInfo.country
        }
        httpsUtils.putUserInfo(param, function (res1) {
          that.triggerEvent('onBut', res1);
          toolUtils.showToast("授权获取个人信息成功")
        })
      }

    },
    //授权获取用户电话回调
    getPhoneNumber: function (e) {
      let that = this
      var iv = e.detail.iv
      var encryptedData = e.detail.encryptedData
      if (!iv && !encryptedData) {
        toolUtils.showToast("授权失败")
        return
      }
      getApp().getToken(function (token) {
        var params = {}
        params.token = token
        params.iv = iv
        params.encryptedData = encryptedData
        httpsUtils.updateTel(params, function (res) {
          isPhone = true
          isAuthorize = true
          that.setData({
            openType: that.data.bntType,
            isAuthorize: isAuthorize
          })
          var pages = getCurrentPages()
          pages[pages.length - 1].setData({
            refreshAuthorizeView: that.data.userInfo ? 3 : 2,
            isPhone: true
          })
          getApp().getRefreshToken(function (token) {
            if (that.data.isImmediatelyBack) {
              var myEventDetail = {
                'typeStr': 'phone'
              }
              var myEventOption = {}
              that.triggerEvent('onBut', myEventDetail, myEventOption)
            }
          })
        }, function (e) {

        })
      })
    },
    //响应其他事件
    butSubmit: function (e) {
      var myEventDetail = e.detail
      var myEventOption = {}
      toolUtils.setFormId(e.detail.formId)
      this.triggerEvent('onBut', myEventDetail, myEventOption)
    }
  }
})