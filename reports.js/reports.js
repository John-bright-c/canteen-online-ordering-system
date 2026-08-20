// ================= SALES OVERVIEW =================
const salesCtx = document.getElementById("salesChart");

new Chart(salesCtx, {
  type: "line",
  data: {
    labels: ["08 May", "09 May", "10 May", "11 May", "12 May", "13 May", "14 May"],
    datasets: [{
      data: [1250, 2150, 4350, 2890, 3760, 3120, 2330],
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
        max: 5000,
        ticks: {
          stepSize: 1000,
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
const statusCtx = document.getElementById("statusChart");

new Chart(statusCtx, {
  type: "doughnut",
  data: {
    labels: ["New", "Preparing", "Ready", "Completed"],
    datasets: [{
      data: [25, 48, 67, 105],
      backgroundColor: ["#f23547", "#ff8900", "#2d79ec", "#45c63d"],
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
const categoryCtx = document.getElementById("categoryChart");

new Chart(categoryCtx, {
  type: "bar",
  data: {
    labels: ["Pizza", "Burgers", "Snacks", "Beverages", "Rolls", "Others"],
    datasets: [{
      data: [6250, 4980, 3750, 2890, 2100, 1880],
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
        max: 8000,
        ticks: {
          stepSize: 2000,
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
