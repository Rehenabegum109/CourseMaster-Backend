// service to handle course-related operations

const Course = require("../models/Course");



const getCourses = async (query) => {
  const {
    page = 1,
    limit = 8,
    search = "",
    sort = "",
    category = "",
    tags = "",
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 8));

  const filter = {};

  // Escape special regex characters
  const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Search by title or instructor
  if (typeof search === "string" && search.trim()) {
    const searchRegex = new RegExp(escapeRegex(search.trim()), "i");

    filter.$or = [
      { title: searchRegex },
      { instructorName: searchRegex },
    ];
  }

  // Category: partial match, case-insensitive
  if (typeof category === "string" && category.trim()) {
    filter.category = {
      $regex: escapeRegex(category.trim()),
      $options: "i",
    };
  }

  // Tags: match any comma-separated tag
  if (typeof tags === "string" && tags.trim()) {
    const tagArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (tagArray.length > 0) {
      filter.tags = {
        $in: tagArray.map(
          (tag) => new RegExp(`^${escapeRegex(tag)}$`, "i")
        ),
      };
    }
  }

  // Sort by price
  const sortObj = {};

  if (sort === "price_asc") {
    sortObj.price = 1;
  }

  if (sort === "price_desc") {
    sortObj.price = -1;
  }

  const skip = (pageNum - 1) * limitNum;

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum),

    Course.countDocuments(filter),
  ]);

  return {
    courses,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  };
};


const getCourseById = async (id) => {
  const course = await Course.findById(id);
  if (!course) throw new Error("Course not found");
  return course;
};

module.exports = { getCourses, getCourseById };
