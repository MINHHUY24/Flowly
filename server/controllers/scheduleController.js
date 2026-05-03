const TABLE_NAME = "schedules";

async function getSchedules(req, res) {
  try {
    const { data, error } = await req.supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("user_id", req.user.id)
      .order("schedule_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.json({
      schedules: data || [],
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

async function createSchedule(req, res) {
  try {
    const {
      title,
      description,
      schedule_date,
      start_time,
      end_time,
      color,
      status,
    } = req.body;

    if (!title || !schedule_date || !start_time || !end_time) {
      return res.status(400).json({
        message: "Thiếu title, schedule_date, start_time hoặc end_time",
      });
    }

    const { data, error } = await req.supabase
      .from(TABLE_NAME)
      .insert({
        user_id: req.user.id,
        title,
        description: description || "",
        schedule_date,
        start_time,
        end_time,
        color: color || "blue",
        status: status || "pending",
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(201).json({
      schedule: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

async function updateSchedule(req, res) {
  try {
    const { id } = req.params;

    const allowedFields = [
      "title",
      "description",
      "schedule_date",
      "start_time",
      "end_time",
      "color",
      "status",
    ];

    const payload = {};

    allowedFields.forEach(function (field) {
      if (req.body[field] !== undefined) {
        payload[field] = req.body[field];
      }
    });

    payload.updated_at = new Date().toISOString();

    const { data, error } = await req.supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.json({
      schedule: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

async function deleteSchedule(req, res) {
  try {
    const { id } = req.params;

    const { error } = await req.supabase
      .from(TABLE_NAME)
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.json({
      message: "Đã xóa lịch",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

module.exports = {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
