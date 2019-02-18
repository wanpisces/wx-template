// page/tabBar/index/index.js
var toolUtils = require("../../../utils/tool-utils.js")
var httpsUtils = require("../../../utils/https-utils.js")
var that
var attrObj
var mPageSize = 10 //每页条数
var mTotalNum //总条数
var mCurrentPage = 1
var mPageSize2 = 3 //每页条数
var mTotalNum2 //总条数
var mCurrentPage2 = 1
// 热搜推荐
var mPageSize3 = 3 //每页条数
var mTotalNum3 //总条数
var mCurrentPage3 = 1

var isOnLoad = false
var windowHeight
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // isCircularMenu: true,
    isCommentShow: true,
    isViewPicker: false,
    'isTeamMore': true,
    user_avatar: null,
    feedList: [],
    attrList: [],
    bgUrl1: getApp().data.bgUrl1,
    bgUrl2: getApp().data.bgUrl2,
    empty: {
      icon: '/pic/no-content.png',
      txt: '暂无热搜推荐队伍'
    },
    tip: '暂无队伍',
    dataList: [],
    search: {
      current_page: 1,
      page_size: 3
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    isOnLoad = true
    that = this;
    that.getData();
    try {
      var value = wx.getStorageSync('userInfo')
      if (value) {
        that.setData({
          isUserInfo: value.data.user_avatar && value.data.user_nickname && true || false,
          isPhone: value.data.user_phone && true || false
        })
      } else { }
    } catch (e) { }
    getApp().userInfo(function (userInfo) {
      that.setData({
        user_avatar: userInfo.user_avatar,
        isUserInfo: userInfo.user_avatar && userInfo.user_nickname && true || false,
        isPhone: userInfo.user_phone && true || false,
        mineUserId: userInfo.user_id
      })
      getIndex()
      getAttrList()
      hotSearch()
    })
    wx.getSystemInfo({
      success: function (res) {
        windowHeight = res.windowHeight
        that.setData({
          statusBarHeight: res.statusBarHeight,
          bgh: (res.statusBarHeight + 45) * 750 / res.windowWidth + 360,
          windowHeight: res.windowHeight
        })
      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // this.setData({
    //   isCircularMenu: true
    // })
    if (!isOnLoad) {
      getApp().userInfo(function (userInfo) {
        that.setData({
          user_avatar: userInfo.user_avatar,
          isUserInfo: userInfo.user_avatar && userInfo.user_nickname && true || false,
          isPhone: userInfo.user_phone && true || false
        })
      })
    } else {
      isOnLoad = false
    }
    getUserInfo()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    // this.setData({
    //   isCircularMenu: false
    // })
  },
  getData: function (msg) {
    var search = that.data.search;
    httpsUtils.findTeam(search, function (res) {
      var list = that.data.dataList || []
      if (search.current_page == 1) {
        list = []
      }
      if (res.list.length > 0) {
        that.setData({
          dataList: list.concat(res.list),
          current_page: res.current_page
        })
      }
      wx.stopPullDownRefresh();
    }, function (e) {

    }, msg)
  },
  // 查看更多（队伍广场）
  checkMoreTeam: function () {
    toolUtils.pageTo('/page/pack-find/find-team/find-team', 1)
  },
  /**
   * 评论
   */
  onComment: function (e) {
    var that = this
    var client = e.changedTouches[0]
    var socrollY = client.pageY - windowHeight + 90
    var item = e.currentTarget.dataset.item
    var index = e.currentTarget.dataset.index
    console.log(e)
    if (socrollY > 0) {
      wx.pageScrollTo({
        scrollTop: socrollY,
        duration: 150
      })
    }
    setTimeout(function () {
      var params = {
        'branch_id': item.feed_id,
        'branch_type': 2,
        'level': 1
      }
      that.setData({
        isCommentShow: false,
        params: JSON.stringify(params)
      })
    }, 300)
  },
  onLongTag: function (e) {
    var item = e.currentTarget.dataset.item
    var index = e.currentTarget.dataset.index
    wx.showModal({
      title: '提示',
      content: '是否删除当前动态？',
      success: function (res) {
        if (res.confirm) {
          var params = {
            feed_id: item.feed_id
          }
          httpsUtils.deleteFeed(params, function (res) {
            var fl = that.data.feedList
            fl.splice(index, 1)
            that.setData({
              feedList: fl
            })
            toolUtils.showToast("删除成功")
          }, function (e) {
            toolUtils.showToast(e.data.msg)
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })

  },
  //找队伍
  findTeamEvt: function () {
    toolUtils.pageTo('/page/pack-find/find-team/find-team', 1)
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    console.log(res)
    if (res.from === 'button') {
      // 来自页面内转发按钮
      var item = res.target.dataset.item
      var contents = toolUtils.canvasTxtHandle(item.feed_content, 50, 1)
      var img
      if (item.feed_pic && item.feed_pic.length > 0) {
        img = item.feed_pic[0]
      }
      return {
        title: contents[0],
        imageUrl: img || '/pic/comment-share-img.jpg',
        path: '/page/pack-index/pages/personal-dynamics/personal-dynamics?isShare=1&feed_id=' + item.feed_id + '&type=2'
      }
    }
  },
  /**
   * 获取分类数据
   */
  onGetAttr: function (e) {
    getAttrList("加载中...")
  },
  //点击头像授权
  onUserAvatar: function (e) {
    console.log(e)
    var userInfo = e.detail.userInfo
    that.setData({
      user_avatar: userInfo.user_avatar,
      isUserInfo: userInfo.user_avatar && userInfo.user_nickname && true || false,
      isPhone: userInfo.user_phone && true || false
    })
  },
  /**
   * 刷新数据
   */
  refreshData: function () {
    mCurrentPage = 1
    mCurrentPage2 = 1
    getIndex()
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    mCurrentPage = 1
    mCurrentPage2 = 1
    getIndex()
  },
  /**
   * 更多队伍
   */
  teamMore: function () {
    if (mTotalNum2 > mPageSize2 * mCurrentPage2) {
      ++mCurrentPage2
      that.setData({
        'isTeamMore': true
      })
      myGroup()
    } else {
      that.setData({
        'isTeamMore': false
      })
    }
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    //热搜推荐
    if (that.data.teamList.length == 0) {
      if (mTotalNum3 > mPageSize3 * mCurrentPage3) {
        ++mCurrentPage3
        that.setData({
          loadData: {
            searchLoading: true, //"上拉加载"的变量，默认false，隐藏  
            searchLoadingComplete: false //“没有数据”的变量，默认false，隐藏  
          }
        })
        hotSearch()
      } else {
        that.setData({
          loadData: {
            searchLoading: false, //"上拉加载"的变量，默认false，隐藏  
            searchLoadingComplete: true //“没有数据”的变量，默认false，隐藏  
          }
        })
      }
    } else {
      //队伍动态
      if (mTotalNum > mPageSize * mCurrentPage) {
        ++mCurrentPage
        that.setData({
          loadData: {
            searchLoading: true, //"上拉加载"的变量，默认false，隐藏  
            searchLoadingComplete: false //“没有数据”的变量，默认false，隐藏  
          }
        })
        feedList()
      } else {
        that.setData({
          loadData: {
            searchLoading: false, //"上拉加载"的变量，默认false，隐藏  
            searchLoadingComplete: true //“没有数据”的变量，默认false，隐藏  
          }
        })
      }
    }

  },
  //点击动态
  onItemSS: function (e) {
    var item = e.currentTarget.dataset.item
    var index = e.currentTarget.dataset.index
    toolUtils.pageTo(`/page/pack-index/pages/personal-dynamics/personal-dynamics?index=${index}&type=2&feed_id=${item.feed_id}`)
  },
  //跳转队伍主页
  onTeamDetail: function (e) {
    var item = e.currentTarget.dataset.item
    // if (item.attr_id == 2) {
    //   toolUtils.pageTo("/page/pack-index/pages/team-page/team-page?group_id=" + item.group_id)
    // } else {
    //   toolUtils.pageTo("/page/pack-index/pages/currency-team-page/team-page?group_id=" + item.group_id)
    // }
    toolUtils.pageTo("/page/pack-index/pages/team-page/team-page?group_id=" + item.group_id)
  },
  //预览图片
  lookImage: function (e) {
    wx.previewImage({
      current: e.currentTarget.dataset.url, // 当前显示图片的http链接
      urls: e.currentTarget.dataset.i // 需要预览的图片http链接列表
    })
  },
  //自定义picker的返回时间
  bindViewPicker: function (e) {
    this.setData({
      isViewPicker: false
    })
    if (e.detail.id == "cancel") {

    } else if (e.detail.id == "confirm") {
      toolUtils.pageTo("/page/pack-index/pages/organize-team/organize-team")
    }
  },

  //pick-view选择器某一列的值改变时触发 
  bindMultiPickerColumnChange: function (e) {
    console.log(e)
    var value = e.detail.value
    var column = e.detail.column
    if (column == 0) {
      this.setData({
        ['attrList[' + 1 + ']']: attrObj[this.data.attrList[0][value].id] || []
      })
    }
  },
})


function getUserInfo() {
  httpsUtils.getUserInfo({}, function (res) {
    that.setData({
      imgUrl: res.user_background || '',
      user: res
    })
    toolUtils.setMyUserInfo(res)
  }, function (e) { })
}