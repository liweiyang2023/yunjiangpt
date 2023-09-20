import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { LoginType, StoreKey } from '@/constants';
import { useUserStore, useAppStore } from '@/store';
import userServices from '@/api/user';
import { LoginTypeEnum } from '@/api/app';
import Header from '@/layout/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useAuth from '@/hooks/use-auth';
import useAppConfig from '@/hooks/use-app-config';
import useWechat from '@/hooks/use-wechat';
import useShareOpenid from '@/hooks/use-share-openid';
import { PrivacyProtocol } from './Protocol';
import { QrCodeDialog } from './QrCodeDialog';
import { LoginForm, RegisterDialog, RetrievePasswordDialog, PhoneLoginForm } from './LoginForm';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isCounting, setIsCounting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [protocolChecked, setProtocolChecked] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [handlelogin2, setHandlelogin2] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthId, setOauthId] = useState('');
  const [loginType, setLoginType] = useAppStore((state) => [state.loginType, state.setLoginType]);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [setUserInfo, setAccessToken] = useUserStore((state) => [state.setUserInfo, state.setAccessToken]);
  const { isWeixinBrowser, weChatLogin } = useWechat();

  const handleLogin = async () => {
    if (isWeixinBrowser) {
      weChatLogin();
      return;
    }

    const currentUrl = location.origin + location.pathname;
    const res = await userServices.getWxQrCode(LoginType.WEIXIN_WEB, currentUrl);
    setQrCodeDialogOpen(true);
    setQrCode(res.qr_code_url);
  };

  const getUserInfo = async () => {
    const code = searchParams.get('code');
    if (code) {
      setProtocolChecked(true);
      try {
        setIsLoading(true);
        const res = await userServices.getUserInfoByCode(
          isWeixinBrowser ? LoginType.WEIXIN : LoginType.WEIXIN_WEB,
          code,
          localStorage.getItem(StoreKey.ShareOpenId) || '',
        );
        if (res.oauth_id) {
          setOauthId(res.oauth_id);
          return;
        }
        setUserInfo(res.user);
        setAccessToken(res.access_token);
        setIsLoading(false);
        navigate('/chat');
      } catch {
        setSearchParams('');
      }
    }
  };
  useEffect(() => {
    getUserInfo();
    let timer: any;
    if (isCounting && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (countdown == 1) {
          setIsCounting(false);
          setCountdown(60);
        }
      }, 1000);
      console.log(isCounting);
    }
    return () => clearTimeout(timer);
  }, [isCounting, countdown]);

  useAuth();
  useShareOpenid();
  const appConfig = useAppConfig();

  function login2() {
    console.log('123');
    setHandlelogin2(false);
  }
  const handleSendEmail = () => {
    // 处理发送邮件的逻辑
    // 在这里可以调用发送邮件的函数或发起网络请求
    // 根据需要进行相应的处理
    setIsCounting(true);
  };
  const handlePasswordChange = (event: Event) => {
    const value = event.target.value;
    setPassword(value);
    // 校验密码
  };
  // 处理登录按钮点击事件
  const handleLogin2 = () => {
    // 校验账号长度
    if (username.length < 6) {
      setErrorMessage('账号长度应大于6位');
      toast.error('账号长度应大于6位');
      return;
    }
    if (password.length < 6 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setErrorMessage('密码应包含至少6位字符，包含英文和数字');
      toast.error('密码应包含至少6位字符，包含英文和数字');
      return;
    }
    // 校验邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('请输入正确的邮箱');
      toast.error('请输入正确的邮箱');
      return;
    }
    navigate('/chat');
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header isPlain />
      <div className="flex flex-1 items-center justify-center">
        <div className="flex w-[32rem] -translate-y-10 flex-col rounded-xl border pb-24 pt-10 shadow max-sm:w-[22rem]">
          {/* 子元素 */}

          <Tabs
            value={loginType + ''}
            className="flex w-full flex-col items-center"
            onValueChange={(val) => setLoginType(val as LoginTypeEnum)}
          >
            {Array.isArray(appConfig.login_type) && (
              <TabsList className="mb-10">
                <TabsTrigger value={LoginTypeEnum.WECHAT}>微信扫码登陆</TabsTrigger>
                <TabsTrigger value={LoginTypeEnum.PASSWORD}>账号密码登陆</TabsTrigger>
              </TabsList>
            )}
            <img src={appConfig.web_logo} className="mb-4 w-40 rounded-full" />
            <div className="text-3xl font-bold"> {appConfig.name} </div>
            <TabsContent value={LoginTypeEnum.WECHAT} className="flex w-full flex-col items-center">
              {handlelogin2 ? (
                <Button className="mb-4 mt-12 w-[70%]" disabled={!protocolChecked} onClick={handleLogin}>
                  {isWeixinBrowser ? '微信登陆' : '微信扫码登录'}
                </Button>
              ) : (
                <>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center">
                      <label htmlFor="username" className="mr-2">
                        账号:
                      </label>
                      <input
                        id="username"
                        className="rounded-md border border-gray-300 px-4 py-2"
                        type="text"
                        placeholder="请输入账号"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center">
                      <label htmlFor="password" className="mr-2">
                        密码:
                      </label>
                      <input
                        id="password"
                        className="rounded-md border border-gray-300 px-4 py-2"
                        type="password"
                        placeholder="请输入密码"
                        value={password}
                        onChange={handlePasswordChange}
                      />
                    </div>
                    <div className="relative">
                      <div className="flex items-center">
                        <label htmlFor="email" className="mr-2">
                          邮箱:
                        </label>
                        <input
                          id="email"
                          className="rounded-md border border-gray-300 px-4 py-2"
                          type="text"
                          placeholder="注册邮箱"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <button
                        className="absolute right-0 top-0 rounded-md bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
                        onClick={handleSendEmail}
                        disabled={isCounting}
                      >
                        {isCounting ? `${countdown}秒` : '发送'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value={LoginTypeEnum.PASSWORD} className="flex w-full flex-col items-center">
              <LoginForm protocolChecked={protocolChecked}></LoginForm>
            </TabsContent>
            <TabsContent value={LoginTypeEnum.WECHAT_AND_PHONE} className="flex w-full flex-col items-center">
              {oauthId ? (
                <PhoneLoginForm oauthId={oauthId} protocolChecked={protocolChecked}></PhoneLoginForm>
              ) : (
                <Button className="mb-4 mt-12 w-[70%]" disabled={!protocolChecked} onClick={handleLogin}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isWeixinBrowser ? '微信登陆' : '微信扫码登录'}
                </Button>
              )}
            </TabsContent>
            <div className="flex items-center text-xs">
              <PrivacyProtocol
                checked={protocolChecked}
                onCheckedChange={(val) => setProtocolChecked(val as boolean)}
              />
            </div>
          </Tabs>
          {loginType === LoginTypeEnum.PASSWORD && (
            <div className="absolute bottom-3 right-3">
              <RegisterDialog>
                <Button variant={'ghost'}>注册</Button>
              </RegisterDialog>
              <RetrievePasswordDialog>
                <Button variant={'ghost'}>找回密码</Button>
              </RetrievePasswordDialog>
            </div>
          )}
          <div className="flex justify-center">
            {!handlelogin2 && (
              <button
                className="rounded-md bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
                onClick={handleLogin2}
              >
                登录
              </button>
            )}
          </div>
          <div>
            {handlelogin2 && (
              <p onClick={login2} style={{ textAlign: 'center' }}>
                账号密码登录
              </p>
            )}
          </div>
          <p style={{ textAlign: 'center' }}>前往注册</p>
        </div>
        <QrCodeDialog
          open={qrCodeDialogOpen}
          qrCode={qrCode}
          handleOpenChange={(val) => {
            setQrCodeDialogOpen(val);
          }}
        />
      </div>
    </div>
  );
}
