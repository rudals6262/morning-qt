import requests
import json

# Step 1: Get the access token
def get_access_token(auth_code):
    url = "https://kauth.kakao.com/oauth/token"
    data = {
        "grant_type": "authorization_code",
        "client_id": "cf04e839ef69c883ff5623c69b51ddda",
        "redirect_uri": "http://localhost:8080/oauth",
        "code": auth_code
    }
    response = requests.post(url, data=data)
    tokens = response.json()
    return tokens

# Step 2: Send a message using the access token
def send_kakao_message(access_token, text):
    url = "https://kapi.kakao.com/v2/api/talk/memo/default/send"
    headers = {
        "Authorization": "Bearer " + access_token
    }
    data = {
        "template_object": json.dumps({
            "object_type": "text",
            "text": text,
            "link": {
                "web_url": "https://www.google.co.kr/search?q=drone&source=lnms&tbm=nws",
                "mobile_web_url": "https://www.google.co.kr/search?q=drone&source=lnms&tbm=nws"
            }
        })
    }
    response = requests.post(url, headers=headers, data=data)
    return response.json()

# 사용자 인증 및 권한 동의를 통해 얻은 새로운 인증 코드 입력
auth_code = "NEW_AUTHORIZATION_CODE"
tokens = get_access_token(auth_code)

if 'access_token' in tokens:
    access_token = tokens['access_token']
    result = send_kakao_message(access_token, "Google 뉴스: drone")
    if result.get('result_code') == 0:
        print('메시지를 성공적으로 보냈습니다.')
    else:
        print('메시지를 성공적으로 보내지 못했습니다. 오류메시지 : ' + str(result))
else:
    print('토큰 발급 실패: ' + str(tokens))
