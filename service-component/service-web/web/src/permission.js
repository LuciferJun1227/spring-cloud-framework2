/**
 * 全站权限配置
 * 
 */
import router from './router/router'
import store from './store'
import { validatenull } from '@/util/validate'
import { getToken } from '@/util/auth'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
NProgress.configure({ showSpinner: false });
const lockPage = store.getters.website.lockPage; //锁屏页
router.beforeEach((to, from, next) => {
    //缓冲设置
    if (to.meta.keepAlive === true && store.state.tags.tagList.some(ele => {
            return ele.value === to.fullPath;
        })) {
        to.meta.$keepAlive = true;
    } else {
        NProgress.start()
        if (to.meta.keepAlive === true && validatenull(to.meta.$keepAlive)) {
            to.meta.$keepAlive = true;
        } else {
            to.meta.$keepAlive = false;
        }
    }
    const meta = to.meta || {};
    if (getToken()) {
        if (store.getters.isLock && to.path != lockPage) { //如果系统激活锁屏，全部跳转到锁屏页
            next({ path: lockPage })
        } else if (to.path === '/login') { //如果登录成功访问登录页跳转到主页
            next({ path: '/' })
        } else {
			console.log('auth')
            //如果用户信息为空则获取用户信息，获取用户信息失败，跳转到登录页
			console.log(store.getters.roles.length)
            if (store.getters.roles.length === 0) {
				console.log('user')
                store.dispatch('GetUserInfo').then(() => {
                    next({...to, replace: true })
                }).catch(() => {
					console.log('FedLogOut')
                    store.dispatch('FedLogOut').then(() => {
                        next({ path: '/login' })
                    })
                })
            } else {
                const value = to.query.src || to.fullPath;
                const label = to.query.name || to.name;
                if (meta.isTab !== false && !validatenull(value) && !validatenull(label)) {
                    store.commit('ADD_TAG', {
                        label: label,
                        value: value,
                        params: to.params,
                        query: to.query,
                        group: router.$avueRouter.group || []
                    });
                }
                next()
            }
        }
    } else {
        //判断是否需要认证，没有登录访问去登录页
        if (meta.isAuth === false) {
            next()
        } else {
            next('/login')
        }
    }
})

router.afterEach(() => {
    NProgress.done();
    const title = store.getters.tag.label;
    //根据当前的标签也获取label的值动态设置浏览器标题
    router.$avueRouter.setTitle(title);
});