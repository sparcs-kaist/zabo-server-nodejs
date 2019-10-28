# API

[SPARCS SSO](https://sparcssso.kaist.ac.kr/)를 사용한 회원 인증이 가능하며 서비스 내에서는 JWT 토큰을 사용합니다.

## LIST

### Authentication

* [`GET` Check Auth](routes.md) /auth
* [`GET` Login](routes.md) /auth/login
* [`POST` Login Callback](routes.md)  /auth/login/callback
* [`GET` Logout](routes.md) /auth/logout
* [`GET` Unregister](routes.md) /auth/unregister

### Group

* [`GET` Get Group Info](routes.md) /group/:groupId
* [`POST` Update Group Photo](routes.md) /group/:groupId
* [`POST` Update Group Member](routes.md) /group/:groupId/member
* [`DELETE` Delete Group Member](routes.md) /group/:groupId/member

### User

* [`GET` Get User Info](routes.md) /user
* [`POST` Set Current Group](routes.md) /user/currentGroup/:groupId

### Zabo

* [`GET` Get Zabo Info](routes.md) /zabo
* [`GET` Get Zabo List](routes.md) /zabo/list
* [`GET` Get Next Zabo List](routes.md) /zabo/list/next
* [`POST` Create New Zabo](routes.md) /zabo
* [`DELETE` Delete Zabo](routes.md) /zabo

### Admin

* [`POST` Create New Group](routes.md) /admin/group
* [`DELETE` Delete Group](routes.md) /admin/group/:groupId
* [`POST` Fake Register](routes.md) /admin/fakeRegister
* [`POST` Fake Login](routes.md) /admin/fakeLogin
* [`GET` Get User Info](routes.md) /admin/user/:studentId

## Authentication

Following **Authorization** field must be set in HTTP request header

```javascript
{
  'Authorization': `Bearer ${jwt}`
 }
```

## Specification

### User

#### `GET` /auth \(\) ⇒ `user`

토큰이 유효한지 검사하고 유효한 경우 유저 정보로 응답합니다.

인증 요구사항 : 유저 엑세스 토큰 \(선택\)

**Errors**

403 : 유효하지 않은 토큰 500

**Example**

#### `GET` /auth/login \(\) =&gt; `redirect to sparcssso`

세션 검증을 위한 state 코드를 생성하고, 유저를 sparcssso 서비스로 리다이렉트 시킵니다.

**Errors**

500

**Example**

#### `POST` /auth/login/callback \(state, code\) =&gt; `{ token, user }`

유효성 확인

* state 코드가 위조되지 않았는지 확인합니다. 

주어진 code로 sparcssso 유저 정보를 취득합니다. 서비스 데이터베이스에 해당 유저의 정보가 존재하는지 체크하고 최신 정보로 업데이트합니다. 유저가 처음 생성된 경우 "저장된 포스터" board를 새로 생성하고 할당합니다. 새로운 엑세스 토큰을 발급합니다. 토큰과 유저 정보로 응답합니다.

**Errors**

401 : 세션 hijacked 500

**Example**

#### `GET` /auth/logout \(\) =&gt; `redirect to sparcssso`

TODO: 토큰을 만료시킵니다. sparcssso 로그아웃 주소로 리다이렉트 시킵니다.

**Errors**

500

**Example**

#### `POST` /auth/unreigister \(\) =&gt; `?`

TODO : 회원 정보를 삭제하고 sparcssso에 등록해지 요청을 보냅니다.

**Errors**

500

**Example**

### Group

#### `GET` /group/:groupId \(\) =&gt; `groupInfo`

그룹 정보를 가져옵니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| groupId | `string` | group id |

**Errors**

404 : 그룹 정보 없음

**Example**

#### `POST` /group/:groupId

유효성 확인

* 그룹의 관리자인지 체크합니다.
* groupId에 해당하는 그룹이 존재하는지 확인합니다.

TODO: 그룹의 정보 \(사진\)을 업데이트할 수 있습니다. 이름도 변경 가능하게 할까?

| Param | Type | Description |
| :--- | :--- | :--- |
| groupId | `string` | group id |

**Errors**

400 : 유효하지 않은 요청 403 : 권한 없음 404 500

**Example**

#### `POST` /group/:groupId/member \(studentId\) =&gt; `groupInfo`

유효성 확인

* 그룹의 관리자인지 체크합니다.
* groupId에 해당하는 그룹이 존재하는지 확인합니다.
* studentId가 유효한지 체크합니다.
* 자신의 권한은 수정할 수 없습니다.

그룹에 멤버를 추가하거나 멤버의 권한을 변경할 수 있습니다. 그룹에 맴버가 추가된 경우, 유저 doc에도 그룹 정보를 추가해줍니다. 업데이트 된 그룹 정보로 응답합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| groupId | `string` | group id |
| studentId | `string` | student id |

**Errors**

400 : 유효하지 않은 요청 403 : 권한 없음 404 500

**Example**

#### `DELETE` /group/:groupId/member \(studentId\) =&gt; `groupInfo`

유효성 확인

* 그룹의 관리자인지 체크합니다.
* groupId에 해당하는 그룹이 존재하는지 확인합니다.
* studentId가 유효한지 체크합니다.
* 자신의 권한은 수정할 수 없습니다.

그룹에서 맴버 정보를 삭제합니다. 삭제된 맴버의 doc에서 해당 그룹 정보를 삭제합니다. 삭제된 맴버의 currentGroup이 해당 그룹일 경우 currentGroup을 초기화시킵니다. 업데이트 된 그룹 정보로 응답합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| groupId | `string` | group id |
| studentId | `string` | student id |

**Errors**

400 : 유효하지 않은 요청 403 : 권한 없음 404 500

**Example**

### User

#### `GET` /user \(\) =&gt; `userInfo`

유효성 확인

* 유효한 토큰인지 확인합니다.

유저 정보 + board, group, currentGroup을 populate 해서 응답합니다.

**Errors**

403 : 권한 없음 500

**Example**

#### `POST` /user/currentGroup/:groupId \(\) =&gt; `userInfo`

유효성 확인

* 유효한 토큰인지 확인합니다.
* 해당 그룹의 맴버인지 확인합니다.

유저의 현재 선택 그룹을 변경합니다. 업데이트 된 유저 정보로 응답합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| groupId | `string` | group id |

**Errors**

400 403 : 권한 없음 404 500

**Example**

### Zabo

#### `GET` /zabo \(id\) =&gt; `zabo`

유효성 확인

* id는 필수입니다.
* id는 mongoDB의 valid한 ObjectID이어야 합니다.
* id가 Database에 존재해야 합니다.

전달받은 id에 해당하는 Zabo를 검색합니다. 해당 Zabo로 응답합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| id | `string` | database id |

**Errors**

400 : null id 혹은 invalid id 404 : 해당하는 zabo가 없음 500

#### `GET` /zabo/list \(\) =&gt; `zaboList`

최초로 보여지는 zabo들을 가져옵니다.

**Errors**

500

#### `GET` /zabo/list/next \(id\) =&gt; `zaboList`

유효성 확인

* id는 필수입니다.
* id가 Database에 존재해야 합니다.

다음으로 보여질 zabo들을 가져옵니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| id | `string` | last id of previous list |

**Errors**

400 : null id 404 : 해당하는 zabo가 없음 500

#### `POST` /zabo \(img, title, description, category, endAt\) =&gt; success

유효성 확인

* img, title, description, category, endAt은 필수입니다.
* img는 20개 이하로 전송해야 합니다.
* category는 recruit, seminar, contest, event, show, fair중 하나여야 합니다.

새로운 zabo를 저장합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| img | `multipart-form-data` | image of zabo |
| title | `string` | title of zabo |
| description | `string` | description of zabo |
| category | `string` | category of zabo |
| endAt | `date` | end time of zabo |

**Errors**

400 500

#### `DELETE` /zabo \(id\) =&gt; success

유효성 확인

* id는 필수입니다.

하나의 zabo를 제거합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| id | `string` | id of zabo |

**Errors**

400 : null id 500

### Admin

#### `POST` /admin/group \(name, ownerStudentId\) =&gt; `groupInfo`

유효성 확인

* name과 ownerStudentId는 필수
* 같은 이름을 가진 그룹이 존재할 수 없음 \(schema constraint\)
* ownerStudentId에 해당하는 유저가 존재해야함

그룹을 생성하고 첫 관리자를 추가합니다. 관리자의 doc에 그룹을 추가합니다. 생성된 그룹 정보로 응답합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| name | `string` | group name |
| ownerStudentId | `string` | student id |

#### `DELETE` /admin/group/:groupId \(\) =&gt; success

TODO '삭제' 상태의 그룹에는 맴버 추가, 그룹 선택 기능이 불가능하도록 한다. 그룹을 상태를 '삭제' 상태로 업데이트한다.  그룹의 맴버가 해당 그룹을 currentGroup으로 가지고 있으면 초기화한다.

| Param | Type | Description |
| :--- | :--- | :--- |
| groupId | `string` | group id |

#### `POST` /admin/fakeRegister \(studentId\) =&gt; `userInfo`

유효성 확인

* studentId는 필수입니다.

새로운 유저를 생성합니다. 생성된 유저의 정보로 응답합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| studentId | `string` | student id |

#### `POST` /admin/fakeLogin \(studentId\) =&gt; `jwt`

액세스 토큰을 발급해줍니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| studentId | `string` | student id |

#### `GET` /admin/user/:studentId \(\) =&gt; `userInfo`

유저 정보로 응답합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| studentId | `string` | student id |

## English

#### `GET` /auth \(\) ⇒ `user`

Check if the token is valid access token and repond with user info

**Auth Requirement**: user access token \

#### `GET` /auth/login \(\) =&gt; `redirect to sparcssso`

Generate state for session verification and redirect user to sparcssso

#### `POST` /auth/login/callback \(state, code\) =&gt; `{ token, user }`

Check if state is not intercepted Get sso user info from given code Check if user info exist in our user database, update with new user info from sso. If it's first time for user to visit our service, create a new board called "저장된 포스터" Generate new token Respond with token and user info

