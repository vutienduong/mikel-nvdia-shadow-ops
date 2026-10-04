# Đối chiếu implementation với PRD

## Cập nhật sau triển khai P0 — 2026-10-05

Các phần P0 bên dưới đã được triển khai: refund/policy/approval guard dùng chung; pause/approve/reject/resume; runtime IR validator, reference/condition evaluator và executable handlers; clean reset; Nebius/Nemotron client với model catalog, validation và provenance; duplicate cùng account/currency/plan trong 48 giờ; receipt và reply đúng ticket; closure prerequisites; lưu failed/waiting runs; chống chạy lặp và invalidation khi reset.

Đã kiểm chứng bằng automated domain/AI/HTTP tests, typecheck/build và browser offline: Maria v1 → Alex refinement v2 → Daniel autonomous; Sarah safe stop/history; pending approval chặn refund; reject không refund; approve mới hoàn tất. Live transport được test bằng stub. **Nemotron inference thật chưa được kiểm chứng vì người dùng chưa có credentials.** App hỗ trợ offline demo được chọn chủ động và ghi nhãn fixture, không fallback âm thầm.

Các mục P1/P2 vẫn là backlog: persistence server-side, workflow version archive/editing, general retry/escalate, date filters, landing/deployment/submission. README và lockfile đã được bổ sung cho việc chạy/kiểm chứng P0. Xem [PRODUCT](PRODUCT.md), [ARCHITECTURE](ARCHITECTURE.md) và [README](../README.md) cho hiện trạng mới.

Phần dưới giữ lại **audit ban đầu ngày 2026-10-04** để có căn cứ trước/sau; các mô tả Gemini, hardcode, seed v2 và bypass approval dưới đây mô tả code trước thay đổi, không phải hiện trạng mới.

Ngày đánh giá: 2026-10-04. Phạm vi: đọc PRD và mã nguồn trong checkout hiện tại. Chưa kiểm chứng browser, inference thật hoặc deployment. `npm run lint` và `npm run build` không thực hiện được vì thiếu `tsc` và `vite`; đây là giới hạn môi trường, chưa phải kết luận code compile lỗi. Không thay đổi logic ứng dụng hoặc PRD trong lần audit này.

## Kết luận

Repo có nền giao diện và thao tác mock tương đối đầy đủ, nhưng chưa đạt vòng học A → cải tiến B → tự chạy C của PRD §39. Phần còn thiếu chủ yếu nằm ở AI thật, workflow IR có validation/execution đúng nghĩa, approval chặn hành động, và bằng chứng học từ nhiều demonstration. Không nên đánh giá mức hoàn thành bằng số màn hình đã có.

## Acceptance criteria §39

“Có code” không đồng nghĩa đã chạy pass; mọi dòng dưới đây là đánh giá từ source.

| # | Yêu cầu | Hiện trạng |
| --- | --- | --- |
| 1 | Mở seeded ticket | Có Inbox và đủ case A/B/C/D. |
| 2 | Bật Teach Mode | Có toggle, tạo demo ID và reset trace trong bộ nhớ. |
| 3 | Xử lý thủ công | Có các nút nghiệp vụ; refund/close chưa bị ràng buộc bởi verification/approval/reply. |
| 4 | Ghi semantic events | Có ở TicketWorkspace; chưa phủ mọi view nghiệp vụ và chưa lưu demonstration/trace bền vững. |
| 5 | Nemotron tạo workflow hợp lệ | Chưa: Gemini/fallback cố định, JSON.parse không phải schema validation. |
| 6 | Review và save | Có modal visual/JSON và save; thiếu Edit và validation trước khi kích hoạt. |
| 7 | Demonstration thứ hai | Có session mới; không giữ/lấy lại trace lần một, không khóa ticket của session. |
| 8 | Phát hiện conditional variation | Có endpoint/UI, nhưng fallback luôn đề xuất >$500; chưa xử lý same/new classification. |
| 9 | Người dùng chấp nhận rule | Có Reject/Add Rule; áp dụng rule hardcode, không áp dụng condition/step thực tế từ proposal. |
| 10 | Workflow thành v2 | Có tăng version tại chỗ; seed vốn đã v2, không giữ snapshot v1. |
| 11 | Ticket thứ ba match workflow | So sánh seeded intent và slug cố định, hiển thị 96% cố định; chưa có AI matching. |
| 12 | Khởi chạy autonomous | Có nút Run và live modal; thiếu khóa chống chạy đồng thời/lặp. |
| 13 | Thực thi đủ skill | Switch thực hiện subset; bỏ qua args/condition IR, thiếu handler draft reply, skill lạ vẫn completed. |
| 14 | Hiển thị trace | Có step output/latency; input và timestamps chưa đầy đủ, failed run không được lưu vào history. |
| 15 | Resolve ticket thành công | Có mutate payment/ticket cho happy path; reply autonomous chỉ mô phỏng delivery, approval không chặn refund. |

## Backlog cần làm trước khi chốt V1

### 1. P0 — Enforce approval và điều kiện refund

Nguồn: [executor](../src/context/AppContext.tsx), [manual actions](../src/components/workspace/TicketWorkspace.tsx), [Payments view](../src/components/workspace/PaymentsView.tsx). PRD §20, §28, §32, §35.

- Khi cần approval: tạo request gắn run/payment, lưu checkpoint, chuyển `waiting_approval` và dừng trước refund.
- Approve mới resume đúng step; Reject kết thúc run và giữ payment nguyên trạng.
- Đặt verification/policy/approval tại handler refund dùng chung cho mọi nút và executor. Workflow v1 chưa học approval cũng không được vượt policy.
- Chống double-click/chạy đồng thời và refund lặp cùng payment; chặn close trước khi các kết quả bắt buộc đã thành công.

Kiểm chứng: Alex không bị refund khi pending/rejected; approve mới refund một lần. Maria/Daniel đủ điều kiện chạy trực tiếp.

### 2. P0 — Biến IR thành hợp đồng thực thi

Nguồn: [types](../src/types/index.ts), [registry](../src/data/skillRegistry.ts), [executor](../src/context/AppContext.tsx). PRD §15, §16, §19, §24.

- Runtime schema validation cho requests, workflow/proposal và từng skill input/output; từ chối skill lạ, ID trùng, reference sai, operator không hỗ trợ.
- Registry có executable handlers; executor resolve `{{...}}`, lưu output theo step/context và evaluate condition theo IR.
- Đồng bộ contract: detect hiện trả `duplicatePaymentId` trong khi IR dùng `duplicate.paymentId`; send reply yêu cầu `message` nhưng workflow mẫu không truyền; draft reply có metadata nhưng không handler.
- Không đánh dấu completed khi không làm được hành động; lỗi phải có trace và trạng thái kết thúc rõ.

Kiểm chứng: IR sai bị từ chối trước mutation; args/condition khác tạo hành vi tương ứng; skill không hỗ trợ fail rõ ràng.

### 3. P0 — Tích hợp Nemotron qua Nebius và minh bạch nguồn kết quả

Nguồn: [AI server](../server.ts), [.env.example](../.env.example), [suggestion panel](../src/components/workspace/ShadowBrainPanel.tsx). PRD §21–23, §33, §45.

- Provider client chạy server-side, cấu hình endpoint/model từ môi trường; xác minh model có sẵn lúc triển khai.
- Inference thật cho induction, comparison, intent/matching và reply. Dùng schema/registry/policy do server sở hữu để kiểm tra kết quả.
- Trả provider/model, trạng thái fallback và lỗi rõ ràng. Offline demo có thể giữ nhưng phải được ghi nhãn; không dùng fallback cố định làm bằng chứng học.
- Confidence từ kết quả có bounds/threshold theo PRD, bỏ 96% cố định; timeout/retry có giới hạn và lỗi không được báo như thành công.

Kiểm chứng: trace khác nhau tạo đề xuất có căn cứ; lỗi/missing credentials hiển thị đúng; UI xác định được output live hay fixture.

### 4. P0 — Reset thật sự chạy được A → B → C

Nguồn: [seed](../src/data/seedData.ts), `stopTeachingAndLearn` và `resetAll` trong [context](../src/context/AppContext.tsx). PRD §5–7, §39, §42.

- Tách chế độ showcase đã có dữ liệu khỏi chế độ demo học mới. Reset learning demo phải bắt đầu với workflows/runs/demonstrations/approvals rỗng và tickets/payments nguyên bản.
- A: Maria → review/save v1. B: Alex → approval → comparison → accept v2. C: Daniel → match v2 → run → reply → resolve.
- Reset/cancel phải xử lý cả inference/execution đang chạy để tránh mutation quay lại sau reset.

Kiểm chứng: chạy lại toàn bộ chuỗi từ reset nhiều lần mà không cần sửa localStorage thủ công; không thêm lặp approval step/ID.

### 5. P0 — Business guardrails và reply đúng dữ liệu

Nguồn: [ticket handlers](../src/components/workspace/TicketWorkspace.tsx), [executor](../src/context/AppContext.tsx), [policies](../src/data/seedData.ts). PRD §27, §30, §32.

- Duplicate phải xét cùng customer, currency, dịch vụ và khoảng thời gian. Hiện chỉ so amount; mô tả registry 60 phút và seed policy 48 giờ cần được xác định ý nghĩa/thống nhất trước khi code.
- Policy phải đánh giá thật, hỗ trợ customer không tồn tại, không duplicate, policy không rõ, tool failure và human review.
- Reply dùng actual refund ID/amount/result; có skill draft và lưu message mock vào ticket history, rồi mới send/close. Hiện manual gửi reference ngẫu nhiên, autonomous không gọi AI tạo reply.
- Reset state riêng của TicketWorkspace khi đổi ticket để tránh mang duplicate/reply của khách trước sang khách sau.

Kiểm chứng: Sarah không refund; hai khoản cùng amount nhưng khác dịch vụ/ngoài cửa sổ không bị refund; thiếu customer/policy dừng rõ; reply chứa đúng receipt.

### 6. P1 — Multi-demo learning, persistence và version history

Nguồn: [learning/refinement](../src/context/AppContext.tsx), [AI comparison](../server.ts). PRD §18, §26, §31.

- Lưu demonstration và event payload đầy đủ; gắn session với ticket cố định, normalize trace và đưa trace cũ vào comparison.
- Xử lý ba kết quả same/variant/new; apply đúng workflow ID và proposal sau validation, tránh rule/step trùng. Review cho phép sửa đề xuất tối thiểu.
- Lưu immutable workflow versions và liên kết source demonstrations; run tham chiếu definition đúng version.
- Chuyển state quan trọng sang persistence server-side để approval/resume/history giữ được sau refresh. Database và CRUD endpoints cụ thể có thể triển khai tối giản; không cần đổi sang Next.js chỉ để khớp stack gợi ý.

Kiểm chứng: accepted proposal có threshold khác $500 được áp dụng đúng; reject không đổi workflow; refresh không mất trace/checkpoint; xem lại được v1 sau khi có v2.

### 7. P1 — Run history và state machine đáng tin cậy

Nguồn: [context](../src/context/AppContext.tsx), [Runs](../src/components/runs/RunsView.tsx), [Execution modal](../src/components/modals/ExecutionModal.tsx). PRD §29–35.

- Lưu run từ queued/running, cập nhật waiting/completed/failed, kể cả run Sarah bị dừng.
- Lưu input/output/error và ISO timestamps cho từng step, duration thực tế; bỏ summary “7/7, 1.4s” cố định.
- Dùng state machine có transition guards cho teaching/execution, hiển thị approval/retry/escalate phù hợp.
- Đóng modal chỉ đóng UI; không xóa run đang là nguồn trạng thái thực thi. Sửa date filters today/7d/30d theo thời gian thật.

Kiểm chứng: failed/pending run hiện trong history; refresh/đóng modal không làm mất trace; durations đúng và không có success giả.

### 8. P1 — Bằng chứng hoàn thiện và gói demo

PRD §36, §40–44.

- Thêm kiểm thử cho A/B/C/D, approval reject/resume, malformed IR, provider failure, repeated execution và reset trong khi chạy.
- Cài dependencies rồi chạy typecheck/build; tạo lockfile để setup có thể tái lập.
- README setup/environment/demo, license được chủ repo lựa chọn, landing tối giản/architecture visual và video tối đa ba phút theo PRD. Yêu cầu cuộc thi hiện hành chưa được xác minh trong audit source này.
- Kiểm chứng deployment và inference thật trước khi ghi nhận trạng thái đã triển khai.

## Những phần nên hoãn

- Automatic scheduling: PRD §3 loại khỏi V1; UI hiện có CRUD/manual trigger nhưng không cron engine.
- Analytics nâng cao: P2; hiện có dữ liệu minh họa và failed runs chưa được thống kê đầy đủ.
- Cancellation/proration workflow: seed có nhưng executor không thực hiện cancellation/proration; là workflow bổ sung P2.
- Integrations thật, OAuth, billing, multi-tenancy, browser/desktop automation: ngoài V1.
- Đổi framework React/Vite/Express sang Next.js: không cần thiết để chứng minh core loop; ưu tiên các hành vi và contract còn thiếu.

Thứ tự đề xuất: approval/refund guard → IR validator/executor → clean demo reset → Nemotron thật → trace/refinement/version storage → run history và bộ acceptance tests → polish/submission.
