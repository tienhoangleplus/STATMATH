// ======================================
// 1. DỮ LIỆU MẪU
// ======================================

const sampleData = [
    [10, 20, 5],
    [20, 30, 8],
    [30, 40, 12],
    [40, 50, 10],
    [50, 60, 5]
];

const colors = [
    "#8058E8",
    "#F47DAF",
    "#5A9CF5",
    "#FFB45C",
    "#5AC6A1",
    "#58C8D9",
    "#B28CEB"
];


// ======================================
// 2. HIỂN THỊ BẢNG NHẬP DỮ LIỆU
// ======================================

function loadExample() {
    document.getElementById("dataBody").innerHTML = "";

    sampleData.forEach(row => addRow(row));

    updateTotal();
    calculate();
}

function addRow(data = ["", "", ""]) {
    const body = document.getElementById("dataBody");
    const tr = document.createElement("tr");

    const index = body.rows.length + 1;

    tr.innerHTML = `
        <td>Nhóm ${index}</td>
        <td><input type="number" class="lower"
            value="${data[0]}" step="any"></td>
        <td><input type="number" class="upper"
            value="${data[1]}" step="any"></td>
        <td><input type="number" class="frequency"
            value="${data[2]}" min="0" step="1"></td>
        <td>
            <button class="delete-btn"
                onclick="removeRow(this)">✕</button>
        </td>
    `;

    body.appendChild(tr);

    tr.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", updateTotal);
    });

    updateTotal();
}

function removeRow(button) {
    button.closest("tr").remove();

    [...document.querySelectorAll("#dataBody tr")]
        .forEach((tr, i) => {
            tr.cells[0].textContent = `Nhóm ${i + 1}`;
        });

    updateTotal();
}

function updateTotal() {
    const frequencies = [
        ...document.querySelectorAll(".frequency")
    ];

    const total = frequencies.reduce((sum, input) => {
        return sum + Math.max(0, Number(input.value) || 0);
    }, 0);

    document.getElementById("totalCount").textContent = total;
}


// ======================================
// 3. LẤY VÀ KIỂM TRA DỮ LIỆU
// ======================================

function getData() {
    const rows = [
        ...document.querySelectorAll("#dataBody tr")
    ];

    if (rows.length === 0) {
        throw new Error("Hãy nhập ít nhất một nhóm dữ liệu.");
    }

    const data = rows.map((tr, index) => {
        const lower = Number(tr.querySelector(".lower").value);
        const upper = Number(tr.querySelector(".upper").value);
        const frequency = Number(
            tr.querySelector(".frequency").value
        );

        if (
            tr.querySelector(".lower").value === "" ||
            tr.querySelector(".upper").value === "" ||
            tr.querySelector(".frequency").value === ""
        ) {
            throw new Error(`Vui lòng điền đầy đủ nhóm ${index + 1}.`);
        }

        if (
            !Number.isFinite(lower) ||
            !Number.isFinite(upper) ||
!Number.isFinite(frequency)
        ) {
            throw new Error("Dữ liệu phải là các số hợp lệ.");
        }

        if (lower >= upper) {
            throw new Error(`Cận dưới nhóm ${index + 1} phải nhỏ hơn cận trên.`);
        }

        if (frequency < 0 || !Number.isInteger(frequency)) {
            throw new Error("Tần số phải là số nguyên không âm.");
        }

        return {
            lower,
            upper,
            frequency,
            midpoint: (lower + upper) / 2,
            width: upper - lower
        };
    });

    data.sort((a, b) => a.lower - b.lower);

    for (let i = 1; i < data.length; i++) {
        if (data[i].lower < data[i - 1].upper) {
            throw new Error("Các khoảng lớp không được chồng lấn.");
        }
    }

    const positive = data.filter(d => d.frequency > 0);

    if (positive.length === 0) {
        throw new Error("Tổng tần số phải lớn hơn 0.");
    }

    const width = positive[0].width;

    if (positive.some(d => Math.abs(d.width - width) > 1e-9)) {
        throw new Error(
            "Phiên bản này yêu cầu các nhóm có cùng độ rộng."
        );
    }

    return data;
}


// ======================================
// 4. TÍNH TỨ PHÂN VỊ VÀ TRUNG VỊ
// ======================================

function groupedQuantile(data, position) {
    let cumulative = 0;

    for (const group of data) {
        const f = group.frequency;

        if (f > 0 && position <= cumulative + f) {
            const L = group.lower;
            const h = group.width;
            const F = cumulative;

            const value = L + ((position - F) / f) * h;

            return {
                value,
                lower: L,
                width: h,
                before: F,
                frequency: f,
                interval: `[${group.lower}; ${group.upper})`
            };
        }

        cumulative += f;
    }

    throw new Error("Không xác định được nhóm chứa vị trí cần tìm.");
}


// ======================================
// 5. HÀM ĐỊNH DẠNG
// ======================================

function format(value) {
    return Number(value).toLocaleString("vi-VN", {
        maximumFractionDigits: 4
    });
}


// ======================================
// 6. TÍNH TOÁN TOÀN BỘ
// ======================================

function calculate() {
    const error = document.getElementById("error");
    error.textContent = "";

    try {
        const data = getData();

        const n = data.reduce(
            (sum, group) => sum + group.frequency, 0
        );

        const sumFX = data.reduce(
            (sum, group) =>
                sum + group.frequency * group.midpoint,
            0
        );

        // Số trung bình
        const mean = sumFX / n;

        // Trung vị và tứ phân vị
        const q1 = groupedQuantile(data, n / 4);
const median = groupedQuantile(data, n / 2);
        const q3 = groupedQuantile(data, 3 * n / 4);

        // Phương sai
        const variance = data.reduce((sum, group) => {
            return sum + group.frequency *
                Math.pow(group.midpoint - mean, 2);
        }, 0) / n;

        // Độ lệch chuẩn
        const deviation = Math.sqrt(variance);

        // Hiển thị kết quả
        document.getElementById("mean").textContent =
            format(mean);

        document.getElementById("median").textContent =
            format(median.value);

        document.getElementById("q1").textContent =
            format(q1.value);

        document.getElementById("q3").textContent =
            format(q3.value);

        document.getElementById("variance").textContent =
            format(variance);

        document.getElementById("deviation").textContent =
            format(deviation);

        // Hiển thị bảng chi tiết
        renderDetail(data);

        // Hiển thị lời giải
        renderExplanation(
            data, n, sumFX, mean,
            q1, median, q3, variance, deviation
        );

        // Vẽ biểu đồ
        drawChart(data);

    } catch (err) {
        error.textContent = "⚠ " + err.message;
    }
}


// ======================================
// 7. BẢNG PHÂN TÍCH CHI TIẾT
// ======================================

function renderDetail(data) {
    const body = document.getElementById("detailBody");

    body.innerHTML = "";

    let cumulative = 0;

    data.forEach(group => {
        cumulative += group.frequency;

        const tr = document.createElement("tr");

        const values = [
            `[${format(group.lower)}; ${format(group.upper)})`,
            format(group.midpoint),
            group.frequency,
            cumulative,
            format(group.frequency * group.midpoint)
        ];

        values.forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });

        body.appendChild(tr);
    });
}


// ======================================
// 8. GIẢI THÍCH TỪNG BƯỚC
// ======================================

function renderExplanation(
    data, n, sumFX, mean,
    q1, median, q3, variance, deviation
) {
    const box = document.getElementById("explanation");

    function explainQuantile(name, result, position) {
        return `
            <p><strong>${name}:</strong></p>
            <p>
                Vị trí cần tìm: ${format(position)}.
            </p>
            <p>
                Nhóm chứa ${name}: ${result.interval}.
            </p>
            <p>
                L = ${format(result.lower)};
                F = ${format(result.before)};
                f = ${result.frequency};
                h = ${format(result.width)}.
            </p>
            <p>
                ${name} = ${format(result.lower)}
+ [(${format(position)} - ${format(result.before)})
                / ${result.frequency}] × ${format(result.width)}
                = <strong>${format(result.value)}</strong>.
            </p>
        `;
    }

    const varianceTerms = data.map(group =>
        `${group.frequency} × (${format(group.midpoint)} - ${format(mean)})²`
    ).join(" + ");

    box.innerHTML = `
        <p><strong>Bước 1. Tính tổng tần số</strong></p>
        <p>n = ${data.map(g => g.frequency).join(" + ")}
        = <strong>${n}</strong>.</p>

        <p><strong>Bước 2. Tính số trung bình</strong></p>
        <p>
            x̄ = Σnᵢxᵢ / n
            = ${format(sumFX)} / ${n}
            = <strong>${format(mean)}</strong>.
        </p>

        <p><strong>Bước 3. Tính trung vị và tứ phân vị</strong></p>
        ${explainQuantile("Q₁", q1, n / 4)}
        ${explainQuantile("Q₂ (Me)", median, n / 2)}
        ${explainQuantile("Q₃", q3, 3 * n / 4)}

        <p><strong>Bước 4. Tính phương sai</strong></p>
        <p>
            s² = [${varianceTerms}] / ${n}
            = <strong>${format(variance)}</strong>.
        </p>

        <p><strong>Bước 5. Tính độ lệch chuẩn</strong></p>
        <p>
            s = √${format(variance)}
            = <strong>${format(deviation)}</strong>.
        </p>