// ================= SALES OVERVIEW =================
const salesCtx = document.getElementById("salesChart");

// salesTrend is injected from the template — see admin_reports.html.
// Expected shape: [{ date: "08 May", revenue: 1250 }, ...]
const trend = Array.isArray(window.salesTrend) ? window.salesTrend : [];

const salesLabels = trend.map(d => d.date);
const salesValues = trend.map(d => d.revenue);

// dynamic y-axis ceiling instead of a hardcoded 5000 cap
const maxRevenue = salesValues.length ? Math.max(...salesValues) : 1000;
const yMax = Math.ceil((maxRevenue * 1.2) / 500) * 500;

new Chart(salesCtx, {
  type: "line",
  data: {
    labels: salesLabels,
    datasets: [{
      data: salesValues,
      borderColor: "#ff8a00",
      backgroundColor: "rgba(255, 138, 0, 0.16)",
      fill: true,
      tension: 0.42,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: "#ff8a00",
      pointBorderColor: "#ff8a00",
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => " ₹" + ctx.parsed.y.toLocaleString("en-IN")
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#d5dbe2", font: { size: 11 } }
      },
      y: {
        min: 0,
        max: yMax,
        ticks: {
          stepSize: yMax / 5,
          color: "#d5dbe2",
          font: { size: 11 },
          callback: value => value === 0 ? "0" : (value / 1000) + "K"
        },
        grid: {
          color: "rgba(124, 139, 157, .16)"
        }
      }
    }
  },
  plugins: [{
    id: "valueLabels",
    afterDatasetsDraw(chart) {
      const {ctx} = chart;
      ctx.save();
      ctx.font = "600 11px Segoe UI";
      ctx.fillStyle = "#f1f3f6";
      ctx.textAlign = "center";

      const meta = chart.getDatasetMeta(0);
      meta.data.forEach((point, i) => {
        ctx.fillText(
          "₹" + chart.data.datasets[0].data[i].toLocaleString("en-IN"),
          point.x,
          point.y - 13
        );
      });
      ctx.restore();
    }
  }]
});

// ================= ORDERS BY STATUS =================
// statusData is injected from the template.
// Matching is case-insensitive now, so a casing mismatch between the
// database value and this code (like the Order_status/order_status bug
// before) can't silently break the counters again.
const findStatus = (name) =>
  statusData.find(item => item.order_status?.toLowerCase() === name.toLowerCase());

const preparing = findStatus("Preparing");
const ready = findStatus("Ready");
const pickedUp = findStatus("Picked up");

document.getElementById("preparingCount").textContent =
    preparing ? preparing.count : 0;

document.getElementById("readyCount").textContent =
    ready ? ready.count : 0;

document.getElementById("pickedUpCount").textContent =
    pickedUp ? pickedUp.count : 0;

const totalOrders = statusData.reduce((total, item) => total + item.count, 0);

document.getElementById("totalOrders").textContent = totalOrders;

const statusCtx = document.getElementById("statusChart");

new Chart(statusCtx, {
  type: "doughnut",
  data: {
    labels: statusData.map(item => item.order_status),
    datasets: [{
      data: statusData.map(item => item.count),
      backgroundColor: statusData.map(item => {
        const s = item.order_status?.toLowerCase();
        if (s === "preparing") return "#f5820a";
        if (s === "ready") return "#2d79ec";
        if (s === "picked up") return "#45c63d";
        return "#8b93a3"; // fallback for any unexpected status
      }),
      borderWidth: 0,
      hoverOffset: 3
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.label}: ${ctx.raw}`
        }
      }
    }
  }
});

// ================= REVENUE BY CATEGORY =================
// This chart has no matching <canvas id="categoryChart"> or panel in
// admin_reports.html right now, so it's guarded off to avoid a silent
// console error on every page load. If you want this chart back, add a
// panel with <canvas id="categoryChart"></canvas> to the HTML and pass a
// `category_data` variable (e.g. [{ item: "Pizza", revenue: 6250 }, ...])
// from your Flask route the same way stats_data and salesTrend are passed.
const categoryCtx = document.getElementById("categoryChart");

if (categoryCtx) {
  const categoryData = Array.isArray(window.categoryData) ? window.categoryData : [];

  new Chart(categoryCtx, {
    type: "bar",
    data: {
      labels: categoryData.map(c => c.item),
      datasets: [{
        data: categoryData.map(c => c.revenue),
        backgroundColor: "#ff8a00",
        borderRadius: 5,
        barThickness: 12
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => " ₹" + ctx.raw.toLocaleString("en-IN")
          }
        }
      },
      scales: {
        x: {
          min: 0,
          ticks: {
            color: "#cbd2db",
            font: { size: 10 },
            callback: value => value === 0 ? "0" : (value / 1000) + "K"
          },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: "#dce1e7",
            font: { size: 11 }
          },
          grid: { display: false }
        }
      }
    },
    plugins: [{
      id: "barValues",
      afterDatasetsDraw(chart) {
        const {ctx} = chart;
        ctx.save();
        ctx.font = "600 11px Segoe UI";
        ctx.fillStyle = "#f0f2f5";
        ctx.textAlign = "left";

        const meta = chart.getDatasetMeta(0);
        meta.data.forEach((bar, i) => {
          ctx.fillText(
            "₹" + chart.data.datasets[0].data[i].toLocaleString("en-IN"),
            bar.x + 12,
            bar.y + 4
          );
        });
        ctx.restore();
      }
    }]
  });
}